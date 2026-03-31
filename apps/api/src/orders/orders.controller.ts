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
import { OrdersService } from "./orders.service";
import { CreateOrdersDto } from "./dto/create-orders.dto";
import { UpdateOrdersDto } from "./dto/update-orders.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("create")
  create(@Body() dto: CreateOrdersDto) {
    return this.ordersService.createMany(dto);
  }

  @Patch("update")
  update(@Body() dto: UpdateOrdersDto) {
    return this.ordersService.updateMany(dto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.ordersService.deleteMany(dto.ids);
  }

  @Get()
  list(@Query("conversationId") conversationId?: string) {
    return this.ordersService.list(conversationId);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.ordersService.detail(id);
  }
}
