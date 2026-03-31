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
import { ShopsService } from "./shops.service";
import { CreateShopsDto } from "./dto/create-shops.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";
import { UpdateShopItemDto } from "./dto/update-shops.dto";
import { ListShopsDto } from "./dto/list-shops.dto";
@Controller("shops")
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post("create")
  create(@Body() dto: CreateShopsDto) {
    return this.shopsService.createMany(dto);
  }

  @Put(":id")
  updateOne(@Param("id") id: string, @Body() body: Omit<UpdateShopItemDto, "id">) {
    return this.shopsService.updateOne(id, body as UpdateShopItemDto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.shopsService.deleteMany(dto.ids);
  }

  @Get()
  list(@Query() query: ListShopsDto) {
    const { userId, includeDeleted, limit, search, isActive } = query;
    return this.shopsService.list({
      userId,
      includeDeleted: includeDeleted === "true",
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
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.shopsService.detail(id);
  }
}
