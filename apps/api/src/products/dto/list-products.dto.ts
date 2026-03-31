import { IsBooleanString, IsNumberString, IsOptional, IsString } from "class-validator";

export class ListProductsDto {
  @IsOptional()
  @IsString()
  shopId?: string;

  @IsOptional()
  @IsBooleanString()
  includeDeleted?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isActive?: string; // "true" | "false"
}

