import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmbeddingEntity } from "@app/database/entities/embedding.entity";
import { ProductEntity } from "@app/database/entities/product.entity";
import { ShopEntity } from "@app/database/entities/shop.entity";
import { AiService } from './ai.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmbeddingEntity, ShopEntity, ProductEntity])],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
