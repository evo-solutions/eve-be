import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { ShopEntity } from "@app/database/entities/shop.entity";
import {
  Cursor,
  cursorPaginate,
} from "@app/database/pagination/cursor-pagination";
import { In, IsNull, Repository } from "typeorm";
import { CreateShopsDto } from "./dto/create-shops.dto";
import { UpdateShopsDto } from "./dto/update-shops.dto";

@Injectable()
export class ShopsService {
  private readonly repo: Repository<ShopEntity>;

  constructor(private readonly databaseService: DatabaseService) {
    this.repo = this.databaseService.dataSource.getRepository(ShopEntity);
  }

  async createMany(dto: CreateShopsDto): Promise<ShopEntity[]> {
    const entities = this.repo.create(dto.items);
    return this.repo.save(entities);
  }

  async updateMany(dto: UpdateShopsDto): Promise<ShopEntity[]> {
    const ids = dto.items.map((item) => item.id);
    const existing = await this.repo.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some shops not found");
    }

    const byId = new Map(existing.map((item) => [item.id, item]));
    for (const patch of dto.items) {
      const entity = byId.get(patch.id);
      if (!entity) {
        continue;
      }
      if (patch.userId !== undefined) entity.userId = patch.userId;
      if (patch.name !== undefined) entity.name = patch.name;
      if (patch.description !== undefined)
        entity.description = patch.description;
      if (patch.isActive !== undefined) entity.isActive = patch.isActive;
    }

    return this.repo.save([...byId.values()]);
  }

  async deleteMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ShopEntity)
      .set({ deletedAt: () => "NOW()" })
      .where("id IN (:...ids)", { ids })
      .andWhere("deleted_at IS NULL")
      .execute();
    return { deletedCount: result.affected ?? 0 };
  }

  async list(params: {
    userId?: string;
    includeDeleted?: boolean;
    cursor?: Cursor | null;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: ShopEntity[]; nextCursor: Cursor | null }> {
    const {
      userId,
      includeDeleted = false,
      cursor,
      limit = 20,
      search,
      isActive,
    } = params;
    const qb = this.repo.createQueryBuilder("shop");
    const paginated = await cursorPaginate(qb, {
      alias: "shop",
      limit,
      cursor: cursor ?? null,
      searchTerm: search,
      searchFields: ["name", "description"],
      filters: {
        ...(userId ? { userId } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
      whereBuilder: (builder) => {
        if (!includeDeleted) {
          builder.andWhere("shop.deleted_at IS NULL");
        }
      },
    });

    return {
      items: paginated.data,
      nextCursor: paginated.pageInfo.endCursor,
    };
  }

  async detail(id: string): Promise<ShopEntity> {
    const shop = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!shop) {
      throw new NotFoundException("Shop not found");
    }
    return shop;
  }
}
