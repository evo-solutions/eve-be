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

const ORDER_STATUSES = ["collecting", "done"] as const;

class CreateOrderLineItemDto {
  @IsUUID()
  productId: string;

  @IsObject()
  metadata: Record<string, unknown>;
}

export class CreateOrderItemDto {
  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsObject()
  shippingInfo?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineItemDto)
  orderItems?: CreateOrderLineItemDto[];

  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];
}

export class CreateOrdersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
