import { Module } from "@nestjs/common";
import { DatabaseModule } from "@app/database/database.module";
import { ApiController } from "./api.controller";
import { ApiService } from "./api.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { ShopsModule } from "./shops/shops.module";
import { FaqsModule } from "./faqs/faqs.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { OrdersModule } from "./orders/orders.module";
import { EmbeddingsModule } from "./embeddings/embeddings.module";
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    UsersModule,
    AuthModule,
    ProductsModule,
    ShopsModule,
    FaqsModule,
    ConversationsModule,
    OrdersModule,
    EmbeddingsModule,
    ChatModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
