import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ShopEntity } from "./shop.entity";

@Entity("products")
@Index("IDX_products_shop_id", ["shopId"])
@Index("IDX_products_deleted_at", ["deletedAt"])
export class ProductEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "shop_id" })
  shopId: string;

  @ManyToOne(() => ShopEntity, (shop) => shop.id)
  @JoinColumn({ name: "shop_id" })
  shop: ShopEntity;

  @Column("text")
  name: string;

  @Column("numeric", { nullable: false })
  price: number;

  @Column("text", { nullable: true })
  thumbnailUrl: string;

  @Column("text", { array: true, nullable: true })
  imageUrls: string[];

  @Column("text", { name: "search_content", nullable: true })
  searchContent: string;

  @Column("jsonb", { name: "order_config", nullable: true })
  orderConfig: Record<string, unknown>;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column("timestamptz", { name: "deleted_at", nullable: true })
  deletedAt: Date;
}
