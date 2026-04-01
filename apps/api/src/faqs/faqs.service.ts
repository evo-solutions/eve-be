import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { FaqEntity } from "@app/database/entities/faq.entity";
import { IsNull, Repository } from "typeorm";
import { CreateFaqsDto } from "./dto/create-faqs.dto";
import { UpdateFaqItemDto } from "./dto/update-faqs.dto";
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
    if (patch.isActive !== undefined) faq.isActive = patch.isActive;

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
    isActive?: boolean;
  }): Promise<FaqEntity[]> {
    const { shopId, includeDeleted = false, limit = 50, search, isActive } =
      params;

    const qb = this.repo.createQueryBuilder("faq");

    if (!includeDeleted) {
      qb.andWhere("faq.deleted_at IS NULL");
    }

    if (shopId) {
      qb.andWhere("faq.shop_id = :shopId", { shopId });
    }

    if (typeof isActive === "boolean") {
      qb.andWhere("faq.is_active = :isActive", { isActive });
    }

    const searchPattern = this.buildIlikeSearchPattern(search);
    if (searchPattern) {
      qb.andWhere(
        "(faq.question ILIKE :searchPattern OR faq.answer ILIKE :searchPattern)",
        { searchPattern },
      );
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

  private buildIlikeSearchPattern(search?: string): string | null {
    const raw = search?.trim().replace(/[%_\\]/g, "") ?? "";
    if (!raw) {
      return null;
    }
    return `%${raw}%`;
  }
}
