import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

const CONVERSATION_STAGES = [
  "DISCOVERY",
  "CONSULTING",
  "COLLECT_INFO",
  "CHECKOUT",
] as const;

export class CreateConversationItemDto {
  @IsUUID()
  shopId: string;

  @IsOptional()
  @IsIn(CONVERSATION_STAGES)
  stage?: (typeof CONVERSATION_STAGES)[number];

  @IsOptional()
  @IsObject()
  consultingProduct?: {
    productId: string;
    metadata: Record<string, unknown>;
  };
}

export class CreateConversationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateConversationItemDto)
  items: CreateConversationItemDto[];
}
