import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class UpdateFaqItemDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  shopId?: string;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;
}

export class UpdateFaqsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateFaqItemDto)
  items: UpdateFaqItemDto[];
}
