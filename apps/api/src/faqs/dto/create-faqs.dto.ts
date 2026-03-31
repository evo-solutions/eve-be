import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class CreateFaqItemDto {
  @IsUUID()
  shopId: string;

  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class CreateFaqsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateFaqItemDto)
  items: CreateFaqItemDto[];
}
