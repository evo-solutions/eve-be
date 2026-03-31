import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
@Index("IDX_users_deleted_at", ["deletedAt"])
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { nullable: false })
  name: string;

  @Column("text", { unique: true, nullable: false })
  email: string;

  @Column("text", { name: "password_hash", nullable: false })
  passwordHash: string;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column("timestamptz", { name: "deleted_at", nullable: true })
  deletedAt: Date;

  @Column("timestamptz", { name: "last_login", nullable: true })
  lastLogin: Date;
}