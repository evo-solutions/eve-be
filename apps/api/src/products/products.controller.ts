import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductsDto } from "./dto/create-products.dto";
import { UpdateProductItemDto } from "./dto/update-products.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";
import { ListProductsDto } from "./dto/list-products.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post("create")
  create(@Body() dto: CreateProductsDto) {
    return this.productsService.createMany(dto);
  }

  @Put(":id")
  updateOne(@Param("id") id: string, @Body() body: Omit<UpdateProductItemDto, "id">) {
    return this.productsService.updateOne(id, body as UpdateProductItemDto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.productsService.deleteMany(dto.ids);
  }

  @Get()
  list(@Query() query: ListProductsDto) {
    const { shopId, includeDeleted, limit, search, isActive } = query;
    const parsedLimit = limit ? Number(limit) : 50;
    const parsedIsActive =
      isActive === undefined
        ? undefined
        : isActive === "true"
          ? true
          : isActive === "false"
            ? false
            : undefined;

    return this.productsService.list({
      shopId,
      includeDeleted: includeDeleted === "true",
      limit: parsedLimit,
      search,
      isActive: parsedIsActive,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.productsService.detail(id);
  }
}
