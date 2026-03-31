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

class UpdateOrderLineItemDto {
  @IsUUID()
  productId: string;

  @IsObject()
  metadata: Record<string, unknown>;
}

export class UpdateOrderItemDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsObject()
  shippingInfo?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderLineItemDto)
  orderItems?: UpdateOrderLineItemDto[];

  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];
}

export class UpdateOrdersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items: UpdateOrderItemDto[];
}
