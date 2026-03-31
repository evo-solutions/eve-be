import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { FaqEntity } from "@app/database/entities/faq.entity";
import { In, IsNull, Repository } from "typeorm";
import { CreateFaqsDto } from "./dto/create-faqs.dto";
import { UpdateFaqItemDto, UpdateFaqsDto } from "./dto/update-faqs.dto";
import { EmbeddingsService } from "../embeddings/embeddings.service";

@Injectable()
export class FaqsService {
  private readonly repo: Repository<FaqEntity>;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.repo = this.databaseService.dataSource.getRepository(FaqEntity);
  }

  async createMany(dto: CreateFaqsDto): Promise<FaqEntity[]> {
    const entities = this.repo.create(dto.items);
    const created = await this.repo.save(entities);
    await this.embeddingsService.createFaqEmbeddings(
      created.map((faq) => ({
        id: faq.id,
        shopId: faq.shopId,
        question: faq.question,
        answer: faq.answer,
      })),
    );
    return created;
  }

  async updateMany(dto: UpdateFaqsDto): Promise<FaqEntity[]> {
    const ids = dto.items.map((item) => item.id);
    const existing = await this.repo.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some FAQs not found");
    }

    const byId = new Map(existing.map((item) => [item.id, item]));
    for (const patch of dto.items) {
      const entity = byId.get(patch.id);
      if (!entity) {
        continue;
      }
      if (patch.shopId !== undefined) entity.shopId = patch.shopId;
      if (patch.question !== undefined) entity.question = patch.question;
      if (patch.answer !== undefined) entity.answer = patch.answer;
    }

    const updated = await this.repo.save([...byId.values()]);
    await this.embeddingsService.replaceFaqEmbeddings(
      updated.map((faq) => ({
        id: faq.id,
        shopId: faq.shopId,
        question: faq.question,
        answer: faq.answer,
      })),
    );
    return updated;
  }

  async updateOne(id: string, patch: UpdateFaqItemDto): Promise<FaqEntity> {
    const faq = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!faq) {
      throw new NotFoundException("FAQ not found");
    }

    if (patch.shopId !== undefined) faq.shopId = patch.shopId;
    if (patch.question !== undefined) faq.question = patch.question;
    if (patch.answer !== undefined) faq.answer = patch.answer;

    const updated = await this.repo.save(faq);
    await this.embeddingsService.replaceFaqEmbeddings([
      {
        id: updated.id,
        shopId: updated.shopId,
        question: updated.question,
        answer: updated.answer,
      },
    ]);
    return updated;
  }

  async deleteMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(FaqEntity)
      .set({ deletedAt: () => "NOW()" })
      .where("id IN (:...ids)", { ids })
      .andWhere("deleted_at IS NULL")
      .execute();
    const deletedCount = result.affected ?? 0;
    if (deletedCount > 0) {
      await this.embeddingsService.deleteFaqEmbeddings(ids);
    }
    return { deletedCount };
  }

  async list(params: {
    shopId?: string;
    includeDeleted?: boolean;
    limit?: number;
    search?: string;
  }): Promise<FaqEntity[]> {
    const { shopId, includeDeleted = false, limit = 50, search } = params;

    const qb = this.repo.createQueryBuilder("faq");

    if (!includeDeleted) {
      qb.andWhere("faq.deleted_at IS NULL");
    }

    if (shopId) {
      qb.andWhere("faq.shop_id = :shopId", { shopId });
    }

    if (search?.trim()) {
      const q = search.trim();
      qb.andWhere("(faq.question % :q OR faq.answer % :q)", {
        q,
      });
    }

    qb.orderBy("faq.created_at", "DESC").take(limit);

    return qb.getMany();
  }

  async detail(id: string): Promise<FaqEntity> {
    const faq = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!faq) {
      throw new NotFoundException("FAQ not found");
    }
    return faq;
  }
}
