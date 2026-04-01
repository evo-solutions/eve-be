import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from "typeorm";
import { ShopEntity } from "./shop.entity";

@Entity("faqs")
@Index("IDX_faqs_shop_id", ["shopId"])
export class FaqEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "shop_id" })
  shopId: string;

  @ManyToOne(() => ShopEntity, (shop) => shop.id)
  @JoinColumn({ name: "shop_id" })
  shop: ShopEntity;

  @Column("text")
  question: string;

  @Column("text")
  answer: string;

  @Column("boolean", { name: "is_active", default: true, nullable: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column("timestamptz", { name: "deleted_at", nullable: true })
  deletedAt: Date;
}
