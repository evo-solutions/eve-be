import { ConversationEntity } from "./conversation.entity";
import { ProductEntity } from "./product.entity";
import { ShopEntity } from "./shop.entity";
import { UserEntity } from "./user.entity";
import { OrderItemEntity } from "./order.entity";
import { EmbeddingEntity } from "./embedding.entity";
import { FaqEntity } from "./faq.entity";

export const DATABASE_ENTITIES = [
  UserEntity,
  ShopEntity,
  ProductEntity,
  ConversationEntity,
  OrderItemEntity,
  EmbeddingEntity,
  FaqEntity,
];
