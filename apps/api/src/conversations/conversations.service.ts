import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { ConversationEntity } from "@app/database/entities/conversation.entity";
import { In, IsNull, Repository } from "typeorm";
import { CreateConversationsDto } from "./dto/create-conversations.dto";
import { UpdateConversationsDto } from "./dto/update-conversations.dto";

@Injectable()
export class ConversationsService {
  private readonly repo: Repository<ConversationEntity>;

  constructor(private readonly databaseService: DatabaseService) {
    this.repo =
      this.databaseService.dataSource.getRepository(ConversationEntity);
  }

  async createMany(dto: CreateConversationsDto): Promise<ConversationEntity[]> {
    const entities = this.repo.create(dto.items);
    return this.repo.save(entities);
  }

  async updateMany(dto: UpdateConversationsDto): Promise<ConversationEntity[]> {
    const ids = dto.items.map((item) => item.id);
    const existing = await this.repo.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some conversations not found");
    }

    const byId = new Map(existing.map((item) => [item.id, item]));
    for (const patch of dto.items) {
      const entity = byId.get(patch.id);
      if (!entity) {
        continue;
      }
      if (patch.shopId !== undefined) entity.shopId = patch.shopId;
      if (patch.stage !== undefined) entity.stage = patch.stage;
      if (patch.consultingProduct !== undefined) {
        entity.consultingProduct = patch.consultingProduct;
      }
    }

    return this.repo.save([...byId.values()]);
  }

  async deleteMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ConversationEntity)
      .set({ deletedAt: () => "NOW()" })
      .where("id IN (:...ids)", { ids })
      .andWhere("deleted_at IS NULL")
      .execute();
    return { deletedCount: result.affected ?? 0 };
  }

  list(shopId?: string, includeDeleted = false): Promise<ConversationEntity[]> {
    return this.repo.find({
      where: {
        ...(shopId ? { shopId } : {}),
        ...(includeDeleted ? {} : { deletedAt: IsNull() }),
      },
      order: { createdAt: "DESC" },
    });
  }

  async detail(id: string): Promise<ConversationEntity> {
    const conversation = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }
    return conversation;
  }
}
