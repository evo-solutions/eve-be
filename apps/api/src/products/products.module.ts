import { Module } from "@nestjs/common";
import { EmbeddingsModule } from "../embeddings/embeddings.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [EmbeddingsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
