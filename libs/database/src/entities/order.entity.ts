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
import { ConversationEntity } from "./conversation.entity";

export type OrderItemStatus = "collecting" | "done";

@Entity("order_items")
@Index("IDX_order_items_conversation_id", ["conversationId"])
export class OrderItemEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "conversation_id" })
  conversationId: string;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.id)
  @JoinColumn({ name: "conversation_id" })
  conversation: ConversationEntity;

  @Column("jsonb", {
    name: "shipping_info",
    nullable: true,
  })
  shippingInfo: Record<string, unknown>;

  @Column("jsonb", {
    name: "order_items",
    nullable: true,
  })
  orderItems: {
    productId: string;
    metadata: Record<string, unknown>;
  }[];

  @Column("text", { default: "collecting" })
  status: OrderItemStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
