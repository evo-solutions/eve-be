import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import OpenAI from "openai";
import { EmbeddingEntity } from "@app/database/entities/embedding.entity";
import { ProductEntity } from "@app/database/entities/product.entity";
import { ShopEntity } from "@app/database/entities/shop.entity";
import { IsNull, Repository } from "typeorm";

export type ChatRole = "assistant" | "user";

export type ChatMessageInput = { role: ChatRole; content: string };

type RetrievalRow = {
  type: "product" | "faq";
  ref_id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  score: number;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;
  private readonly chatModel: string;
  private readonly embeddingModel: string;

  constructor(
    @InjectRepository(EmbeddingEntity)
    private readonly aiIndexRepo: Repository<EmbeddingEntity>,
    @InjectRepository(ShopEntity)
    private readonly shopRepo: Repository<ShopEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.chatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
    this.embeddingModel =
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  }

  async completeWithRag(params: {
    shopId: string;
    messages: ChatMessageInput[];
    currentProductId?: string | null;
  }): Promise<string> {
    const lastMessage =
      params.messages[params.messages.length - 1]?.content?.trim() ?? "";
    if (!lastMessage) {
      return "Bạn có thể mô tả rõ nhu cầu để mình tư vấn chính xác hơn không?";
    }
    const { shopInfo, productList } = await this.loadPromptData(params.shopId);
    let context = "";
    const queryEmbedding = await this.embed(lastMessage);
    const results = await this.search(params.shopId, queryEmbedding);
    context = this.buildContext(results);
    const systemMessage: ChatMessageInput = { role: "assistant", content: this.buildSystemPrompt() };
    const userPrompt = this.buildUserPrompt({
      shopInfo,
      productList,
      context,
      question: lastMessage,
    });

    const rest = params.messages.filter((m) => m.role !== "assistant");
    const chatMessages: ChatMessageInput[] = [
      ...rest.slice(0, -1),
      { role: "user", content: userPrompt },
    ];
    const completion = await this.client.chat.completions.create({
      model: this.chatModel,
      messages: [systemMessage, ...chatMessages].map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const output = completion.choices[0]?.message?.content?.trim() ?? "";
    return output;
  }

  private async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return res.data[0]?.embedding ?? [];
  }

  private async search(
    shopId: string,
    queryEmbedding: number[],
  ): Promise<RetrievalRow[]> {
    if (queryEmbedding.length === 0) {
      return [];
    }

    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    const rows = (await this.aiIndexRepo.query(
      `
      SELECT
        type,
        ref_id,
        content,
        metadata,
        embedding <=> $1::vector AS score
      FROM embeddings
      WHERE shop_id = $2::uuid
        AND deleted_at IS NULL
      ORDER BY score ASC
      LIMIT 5
      `,
      [vectorLiteral, shopId],
    )) as RetrievalRow[];
    return rows ?? [];
  }

  private buildContext(results: RetrievalRow[]): string {
    return results.map((r) => r.content).join("\n\n");
  }

  private buildSystemPrompt(): string {
    return [
      "Bạn là nhân viên tư vấn bán hàng cho một shop cụ thể.",
      "",
      "NHIỆM VỤ:",
      "- Chỉ tư vấn và trả lời dựa trên thông tin của shop và sản phẩm được cung cấp",
      "- Giúp khách chọn sản phẩm phù hợp",
      "- Trả lời tự nhiên, giống người bán hàng",
      "",
      "QUY TẮC BẮT BUỘC:",
      "1. CHỈ được sử dụng thông tin trong: SHOP_INFO, PRODUCT_LIST, CONTEXT (RAG)",
      "2. KHÔNG được tự bịa thông tin ngoài",
      '3. Nếu không có thông tin -> nói: "Hiện tại shop chưa có thông tin này, mình sẽ kiểm tra lại giúp bạn nhé"',
      "4. KHÔNG được tư vấn sản phẩm không có trong PRODUCT_LIST",
      "5. Ưu tiên gợi ý sản phẩm cụ thể khi có thể",
      "6. Nếu câu hỏi không liên quan đến sản phẩm hoặc shop -> trả lời rằng bạn chỉ hỗ trợ về sản phẩm của shop",
      "",
      "HÀNH VI THEO NGỮ CẢNH:",
      '- Nếu khách hỏi chung (ví dụ: "shop bán gì", "có những mẫu nào") -> liệt kê PRODUCT_LIST ngắn gọn, dễ đọc',
      "- Nếu khách hỏi về sản phẩm hoặc nhu cầu cụ thể -> dùng CONTEXT để trả lời",
      "- Nếu khách hỏi FAQ -> dùng CONTEXT để trả lời",
      "- Nếu khách có dấu hiệu muốn mua -> gợi ý sản phẩm + hỏi thêm thông tin (số lượng, màu...)",
      "",
      "PHONG CÁCH: thân thiện, ngắn gọn, dễ hiểu, có thể gợi ý nhẹ để dẫn đến mua hàng.",
    ].join("\n");
  }

  private buildUserPrompt(params: {
    shopInfo: string;
    productList: string;
    context: string;
    question: string;
  }): string {
    return [
      `SHOP_INFO:\n${params.shopInfo || "Không có thông tin shop."}`,
      "",
      `PRODUCT_LIST:\n${params.productList || "Shop chưa có sản phẩm đang hoạt động."}`,
      "",
      `CONTEXT:\n${params.context || "(trống)"}`,
      "",
      `CÂU HỎI:\n${params.question}`,
      "",
      "Trả lời:",
    ].join("\n");
  }

  private async loadPromptData(shopId: string): Promise<{
    shopInfo: string;
    productList: string;
  }> {
    const [shop, products] = await Promise.all([
      this.shopRepo.findOne({
        where: { id: shopId, deletedAt: IsNull() },
        select: ["id", "name", "description"],
      }),
      this.productRepo.find({
        where: { shopId, deletedAt: IsNull(), isActive: true },
        select: ["name", "price"],
        order: { createdAt: "DESC" },
      }),
    ]);

    const shopInfo = shop
      ? `Tên shop: ${shop.name}\n${shop.description?.trim() ?? ""}`.trim()
      : "Tên shop: Không xác định";

    const productList = products
      .map((p) => `- ${p.name} (${this.formatPrice(p.price)}đ)`)
      .join("\n");

    return { shopInfo, productList };
  }

  private formatPrice(value: number | string): string {
    const raw = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(raw)) {
      return String(value);
    }
    return Math.round(raw).toString();
  }
}

