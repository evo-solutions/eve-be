import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { EmbeddingEntity } from "@app/database/entities/embedding.entity";
import { Repository } from "typeorm";
import OpenAI from "openai";

type FaqEmbeddingPayload = {
  id: string;
  shopId: string;
  question: string;
  answer: string;
};

type ProductEmbeddingPayload = {
  id: string;
  shopId: string;
  searchContent?: string | null;
};

@Injectable()
export class EmbeddingsService {
  private readonly repo: Repository<EmbeddingEntity>;
  private readonly openaiClient: OpenAI;
  private readonly embeddingModel: string;

  constructor(private readonly databaseService: DatabaseService) {
    this.repo = this.databaseService.dataSource.getRepository(EmbeddingEntity);
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.embeddingModel =
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  }

  async createFaqEmbeddings(items: FaqEmbeddingPayload[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const entities = await Promise.all(
      items.map(async (item) => {
        const content = this.formatFaqContent(item.question, item.answer);
        const embedding = await this.generateEmbedding(content);
        return this.repo.create({
          shopId: item.shopId,
          type: "faq",
          refId: item.id,
          content,
          embedding,
          metadata: {
            question: item.question,
            answer: item.answer,
          },
        });
      }),
    );

    await this.repo.save(entities);
  }

  async replaceFaqEmbeddings(items: FaqEmbeddingPayload[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.deleteFaqEmbeddings(items.map((item) => item.id));
    await this.createFaqEmbeddings(items);
  }

  async deleteFaqEmbeddings(refIds: string[]): Promise<void> {
    if (refIds.length === 0) {
      return;
    }

    await this.repo
      .createQueryBuilder()
      .update(EmbeddingEntity)
      .set({ deletedAt: () => "NOW()" })
      .where("type = :type", { type: "faq" })
      .andWhere("ref_id IN (:...refIds)", { refIds: [...new Set(refIds)] })
      .andWhere("deleted_at IS NULL")
      .execute();
  }

  async createProductEmbeddings(
    items: ProductEmbeddingPayload[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const validItems = items.filter(
      (item) => this.normalizeContent(item.searchContent).length > 0,
    );
    if (validItems.length === 0) {
      return;
    }

    const entities = await Promise.all(
      validItems.map(async (item) => {
        const content = this.normalizeContent(item.searchContent);
        const embedding = await this.generateEmbedding(content);
        return this.repo.create({
          shopId: item.shopId,
          type: "product",
          refId: item.id,
          content,
          embedding,
          metadata: {
            searchContent: content,
          },
        });
      }),
    );

    await this.repo.save(entities);
  }

  async replaceProductEmbeddings(
    items: ProductEmbeddingPayload[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.deleteProductEmbeddings(items.map((item) => item.id));
    await this.createProductEmbeddings(items);
  }

  async deleteProductEmbeddings(refIds: string[]): Promise<void> {
    if (refIds.length === 0) {
      return;
    }

    await this.repo
      .createQueryBuilder()
      .update(EmbeddingEntity)
      .set({ deletedAt: () => "NOW()" })
      .where("type = :type", { type: "product" })
      .andWhere("ref_id IN (:...refIds)", { refIds: [...new Set(refIds)] })
      .andWhere("deleted_at IS NULL")
      .execute();
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    const response = await this.openaiClient.embeddings.create({
      model: this.embeddingModel,
      input: content,
    });
    return response.data[0]?.embedding ?? [];
  }

  private formatFaqContent(question: string, answer: string): string {
    return `Câu hỏi: ${question}\nTrả lời: ${answer}`;
  }

  private normalizeContent(value?: string | null): string {
    return (value ?? "").trim();
  }
}
