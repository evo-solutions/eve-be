import { Module } from "@nestjs/common";
import { EmbeddingsModule } from "../embeddings/embeddings.module";
import { FaqsController } from "./faqs.controller";
import { FaqsService } from "./faqs.service";

@Module({
  imports: [EmbeddingsModule],
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
