import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { ShopEntity } from "@app/database/entities/shop.entity";
import { IsNull, Repository } from "typeorm";
import { CreateShopsDto } from "./dto/create-shops.dto";
import { UpdateShopItemDto } from "./dto/update-shops.dto";

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

  async updateOne(id: string, patch: UpdateShopItemDto): Promise<ShopEntity> {
    const shop = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!shop) {
      throw new NotFoundException("Shop not found");
    }

    if (patch.userId !== undefined) shop.userId = patch.userId;
    if (patch.name !== undefined) shop.name = patch.name;
    if (patch.description !== undefined) shop.description = patch.description;
    if (patch.isActive !== undefined) shop.isActive = patch.isActive;

    return this.repo.save(shop);
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
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<ShopEntity[]> {
    const { userId, includeDeleted = false, limit = 50, search, isActive } = params;
    const qb = this.repo.createQueryBuilder("shop");

    if (!includeDeleted) {
      qb.andWhere("shop.deleted_at IS NULL");
    }
    if (userId) {
      qb.andWhere("shop.user_id = :userId", { userId });
    }
    if (typeof isActive === "boolean") {
      qb.andWhere("shop.is_active = :isActive", { isActive });
    }
    const searchPattern = this.buildIlikeSearchPattern(search);
    if (searchPattern) {
      qb.andWhere(
        "(shop.name ILIKE :searchPattern OR COALESCE(shop.description, '') ILIKE :searchPattern)",
        { searchPattern },
      );
    }

    qb.orderBy("shop.created_at", "DESC").take(limit);
    return qb.getMany();
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

  /** ILIKE %term% — không phụ thuộc pg_trgm; bỏ ký tự wildcard để tránh lệch ý định. */
  private buildIlikeSearchPattern(search?: string): string | null {
    const raw = search?.trim().replace(/[%_\\]/g, "") ?? "";
    if (!raw) {
      return null;
    }
    return `%${raw}%`;
  }
}
