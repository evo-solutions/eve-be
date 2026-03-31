import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Cursor } from "@app/database/pagination/cursor-pagination";
import { ProductsService } from "./products.service";
import { CreateProductsDto } from "./dto/create-products.dto";
import { UpdateProductsDto } from "./dto/update-products.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";

function parseCursorToken(cursor?: string): Cursor | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as Cursor;
  } catch {
    return null;
  }
}

function toCursorToken(cursor: Cursor | null): string | null {
  if (!cursor) return null;
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
}

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post("create")
  create(@Body() dto: CreateProductsDto) {
    return this.productsService.createMany(dto);
  }

  @Patch("update")
  update(@Body() dto: UpdateProductsDto) {
    return this.productsService.updateMany(dto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.productsService.deleteMany(dto.ids);
  }

  @Get()
  list(
    @Query("shopId") shopId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.productsService
      .list({
        shopId,
        includeDeleted: includeDeleted === "true",
        cursor: parseCursorToken(cursor),
        limit: limit ? Number(limit) : undefined,
        search,
        isActive:
          isActive === undefined
            ? undefined
            : isActive === "true"
              ? true
              : isActive === "false"
                ? false
                : undefined,
      })
      .then((result) => ({
        items: result.items,
        nextCursor: toCursorToken(result.nextCursor),
      }));
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.productsService.detail(id);
  }
}
