import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";

const CONVERSATION_STAGES = [
  "DISCOVERY",
  "CONSULTING",
  "COLLECT_INFO",
  "CHECKOUT",
] as const;

export class UpdateConversationItemDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  shopId?: string;

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

export class UpdateConversationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateConversationItemDto)
  items: UpdateConversationItemDto[];
}
