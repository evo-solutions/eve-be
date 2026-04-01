import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { ProductEntity } from "@app/database/entities/product.entity";
import { IsNull, Repository } from "typeorm";
import { CreateProductsDto } from "./dto/create-products.dto";
import { UpdateProductItemDto } from "./dto/update-products.dto";
import { EmbeddingsService } from "../embeddings/embeddings.service";

@Injectable()
export class ProductsService {
  private readonly repo: Repository<ProductEntity>;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.repo = this.databaseService.dataSource.getRepository(ProductEntity);
  }

  async createMany(dto: CreateProductsDto): Promise<ProductEntity[]> {
    const entities = this.repo.create(dto.items);
    const created = await this.repo.save(entities);
    await this.embeddingsService.createProductEmbeddings(
      created.map((product) => ({
        id: product.id,
        shopId: product.shopId,
        searchContent: product.searchContent,
      })),
    );
    return created;
  }

  async updateOne(id: string, patch: UpdateProductItemDto): Promise<ProductEntity> {
    const product = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    if (patch.shopId !== undefined) product.shopId = patch.shopId;
    if (patch.name !== undefined) product.name = patch.name;
    if (patch.price !== undefined) product.price = patch.price;
    if (patch.thumbnailUrl !== undefined) product.thumbnailUrl = patch.thumbnailUrl;
    if (patch.imageUrls !== undefined) product.imageUrls = patch.imageUrls;
    if (patch.searchContent !== undefined) product.searchContent = patch.searchContent;
    if (patch.orderConfig !== undefined) product.orderConfig = patch.orderConfig;
    if (patch.isActive !== undefined) product.isActive = patch.isActive;

    const updated = await this.repo.save(product);
    await this.embeddingsService.replaceProductEmbeddings([
      {
        id: updated.id,
        shopId: updated.shopId,
        searchContent: updated.searchContent,
      },
    ]);
    return updated;
  }

  async deleteMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProductEntity)
      .set({ deletedAt: () => "NOW()" })
      .where("id IN (:...ids)", { ids })
      .andWhere("deleted_at IS NULL")
      .execute();
    const deletedCount = result.affected ?? 0;
    if (deletedCount > 0) {
      await this.embeddingsService.deleteProductEmbeddings(ids);
    }
    return { deletedCount };
  }

  async list(params: {
    shopId?: string;
    includeDeleted?: boolean;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<ProductEntity[]> {
    const { shopId, includeDeleted = false, limit = 50, search, isActive } = params;
    const qb = this.repo.createQueryBuilder("product");

    if (!includeDeleted) {
      qb.andWhere("product.deleted_at IS NULL");
    }

    if (shopId) {
      qb.andWhere("product.shop_id = :shopId", { shopId });
    }

    if (typeof isActive === "boolean") {
      qb.andWhere("product.is_active = :isActive", { isActive });
    }

    const searchPattern = this.buildIlikeSearchPattern(search);
    if (searchPattern) {
      // Dùng tên property trên entity (name, searchContent, thumbnailUrl) để TypeORM map đúng cột DB.
      qb.andWhere(
        "(product.name ILIKE :searchPattern OR COALESCE(product.searchContent, '') ILIKE :searchPattern OR COALESCE(product.thumbnailUrl, '') ILIKE :searchPattern)",
        { searchPattern },
      );
    }

    qb.orderBy("product.created_at", "DESC").take(limit);

    return qb.getMany();
  }

  async detail(id: string): Promise<ProductEntity> {
    const product = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  private buildIlikeSearchPattern(search?: string): string | null {
    const raw = search?.trim().replace(/[%_\\]/g, "") ?? "";
    if (!raw) {
      return null;
    }
    return `%${raw}%`;
  }
}
