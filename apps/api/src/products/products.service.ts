import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { ProductEntity } from "@app/database/entities/product.entity";
import { In, IsNull, Repository } from "typeorm";
import { CreateProductsDto } from "./dto/create-products.dto";
import { UpdateProductItemDto, UpdateProductsDto } from "./dto/update-products.dto";
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

  async updateMany(dto: UpdateProductsDto): Promise<ProductEntity[]> {
    const ids = dto.items.map((item) => item.id);
    const existing = await this.repo.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some products not found");
    }

    const byId = new Map(existing.map((item) => [item.id, item]));
    for (const patch of dto.items) {
      const entity = byId.get(patch.id);
      if (!entity) {
        continue;
      }
      if (patch.shopId !== undefined) entity.shopId = patch.shopId;
      if (patch.name !== undefined) entity.name = patch.name;
      if (patch.price !== undefined) entity.price = patch.price;
      if (patch.thumbnailUrl !== undefined)
        entity.thumbnailUrl = patch.thumbnailUrl;
      if (patch.imageUrls !== undefined) entity.imageUrls = patch.imageUrls;
      if (patch.searchContent !== undefined)
        entity.searchContent = patch.searchContent;
      if (patch.orderConfig !== undefined)
        entity.orderConfig = patch.orderConfig;
      if (patch.isActive !== undefined) entity.isActive = patch.isActive;
    }

    const updated = await this.repo.save([...byId.values()]);
    await this.embeddingsService.replaceProductEmbeddings(
      updated.map((product) => ({
        id: product.id,
        shopId: product.shopId,
        searchContent: product.searchContent,
      })),
    );
    return updated;
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

    if (search?.trim()) {
      const q = search.trim();
      qb.andWhere(
        "(product.name % :q OR product.search_content % :q OR product.thumbnail_url % :q)",
        { q },
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
}
