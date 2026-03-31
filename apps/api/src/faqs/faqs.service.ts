import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { FaqEntity } from "@app/database/entities/faq.entity";
import {
  Cursor,
  cursorPaginate,
} from "@app/database/pagination/cursor-pagination";
import { In, IsNull, Repository } from "typeorm";
import { CreateFaqsDto } from "./dto/create-faqs.dto";
import { UpdateFaqsDto } from "./dto/update-faqs.dto";
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
    cursor?: Cursor | null;
    limit?: number;
    search?: string;
  }): Promise<{ items: FaqEntity[]; nextCursor: Cursor | null }> {
    const {
      shopId,
      includeDeleted = false,
      cursor,
      limit = 20,
      search,
    } = params;
    const qb = this.repo.createQueryBuilder("faq");
    const paginated = await cursorPaginate(qb, {
      alias: "faq",
      limit,
      cursor: cursor ?? null,
      searchTerm: search,
      searchFields: ["question", "answer"],
      filters: {
        ...(shopId ? { shopId } : {}),
      },
      whereBuilder: (builder) => {
        if (!includeDeleted) {
          builder.andWhere("faq.deleted_at IS NULL");
        }
      },
    });

    return {
      items: paginated.data,
      nextCursor: paginated.pageInfo.endCursor,
    };
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
