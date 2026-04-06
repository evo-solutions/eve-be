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
      "- Tư vấn sản phẩm dựa trên dữ liệu được cung cấp",
      "- Giúp khách chọn sản phẩm phù hợp",
      "- Trả lời giống người bán hàng thật",
      "",
      "QUY TẮC BẮT BUỘC:",
      "1. CHỈ được sử dụng thông tin trong: SHOP_INFO, PRODUCT_LIST, CONTEXT (RAG)",
      "2. TUYỆT ĐỐI KHÔNG suy luận, KHÔNG bịa, KHÔNG thêm thông tin ngoài dữ liệu",
      "3. Nếu KHÔNG có thông tin -> CHỈ được trả lời đúng 1 câu duy nhất sau và không thêm gì khác:",
      '"Hiện tại shop chưa có thông tin này, mình sẽ kiểm tra lại giúp bạn nhé"',
      "4. KHÔNG được tư vấn sản phẩm không có trong PRODUCT_LIST",
      "5. Nếu câu hỏi không có trong SHOP_INFO hoặc CONTEXT -> bắt buộc dùng rule 3",
      "6. Không chắc chắn -> bắt buộc dùng rule 3, tuyệt đối không bịa thông tin",
      "7. Khi trả lời, ưu tiên dùng từ ngữ giống với dữ liệu gốc trong CONTEXT",
      "",
      "GIỚI HẠN CÂU TRẢ LỜI:",
      "- Tối đa 3 câu",
      "- Không giải thích dài dòng",
      "",
      "FAQ / CONTEXT:",
      "- CHỈ trả lời nếu thông tin xuất hiện rõ ràng trong CONTEXT",
      "- KHÔNG suy diễn, KHÔNG đoán, KHÔNG fill thiếu",
      "- Không có dữ liệu -> bắt buộc dùng rule 3",
      "",
      "HÀNH VI THEO NGỮ CẢNH:",
      '- Nếu khách hỏi chung (ví dụ: "shop bán gì", "có những mẫu nào") -> liệt kê PRODUCT_LIST ngắn gọn, dễ đọc',
      "- Hỏi cụ thể -> trả lời đúng phần liên quan, không lan sang thông tin khác",
      "- Có ý định mua -> gợi ý tối đa 2 sản phẩm + hỏi 1 câu duy nhất",
      "",
      "FLOW ĐẶT HÀNG:",
      "- Khi khách có ý định mua (vd: ok lấy, đặt hàng, mua) -> bắt đầu flow order",
      "- Bước 1: Xác nhận sản phẩm khách muốn mua (tên sản phẩm)",
      "- Bước 2: Hỏi số lượng (nếu chưa có)",
      "- Bước 3: Thu thập thông tin đặt hàng theo nguyên tắc:",
      "  + Nếu thiếu cả số điện thoại và địa chỉ -> hỏi: 'Bạn cho mình xin số điện thoại và địa chỉ nhận hàng nhé?'",
      "  + Nếu chỉ thiếu số điện thoại -> hỏi số điện thoại",
      "  + Nếu chỉ thiếu địa chỉ -> hỏi địa chỉ",
      "- KHÔNG hỏi thông tin đã có",
      "- Khi đã đủ: sản phẩm + số lượng + số điện thoại + địa chỉ -> tóm tắt đơn hàng",
      "- Sau khi tóm tắt -> hỏi xác nhận cuối: 'Mình lên đơn cho bạn nhé?'",
      "",
      "FORMAT TRẢ LỜI:",
      "- Không dùng markdown",
      "- Không emoji",
      "- Không ký tự đặc biệt dư thừa",
      "",
      "PHONG CÁCH:",
      "- Thân thiện",
      "- Ngắn gọn",
      "- Tự nhiên như người thật",
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

