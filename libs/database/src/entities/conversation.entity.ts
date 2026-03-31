import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type ConversationStage =
  | "DISCOVERY"
  | "CONSULTING"
  | "COLLECT_INFO"
  | "CHECKOUT";

@Entity("conversations")
@Index("IDX_conversations_shop_id", ["shopId"])
export class ConversationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "shop_id" })
  shopId: string;

  @Column("text", {
    default: "DISCOVERY",
  })
  stage: ConversationStage;

  @Column("jsonb", {
    name: "consulting_product",
    nullable: true,
  })
  consultingProduct: {
    productId: string;
    metadata: Record<string, unknown>;
  };

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column("timestamptz", { name: "deleted_at", nullable: true })
  deletedAt: Date;
}
