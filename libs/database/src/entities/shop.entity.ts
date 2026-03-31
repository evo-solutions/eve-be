import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("shops")
@Index("IDX_shops_user_id", ["userId"])
@Index("IDX_shops_deleted_at", ["deletedAt"])
export class ShopEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("text")
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column("timestamptz", { name: "deleted_at", nullable: true })
  deletedAt: Date;
}
