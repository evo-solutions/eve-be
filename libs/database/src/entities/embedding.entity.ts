import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("embeddings")
@Index("IDX_embeddings_shop_id", ["shopId"])
@Index("IDX_embeddings_type", ["type"])
export class EmbeddingEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "shop_id" })
  shopId: string;

  @Column("text")
  type: "product" | "faq";

  @Column("uuid", { name: "ref_id" })
  refId: string;

  @Column("text")
  content: string;

  @Column("vector", { length: 1536 })
  embedding: number[];

  @Column("jsonb", { nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column("timestamptz", { name: "deleted_at", nullable: true })
  deletedAt: Date;
}
