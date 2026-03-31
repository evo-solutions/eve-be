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
import { ConversationsService } from "./conversations.service";
import { CreateConversationsDto } from "./dto/create-conversations.dto";
import { UpdateConversationsDto } from "./dto/update-conversations.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";

@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post("create")
  create(@Body() dto: CreateConversationsDto) {
    return this.conversationsService.createMany(dto);
  }

  @Patch("update")
  update(@Body() dto: UpdateConversationsDto) {
    return this.conversationsService.updateMany(dto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.conversationsService.deleteMany(dto.ids);
  }

  @Get()
  list(
    @Query("shopId") shopId?: string,
    @Query("includeDeleted") includeDeleted?: string,
  ) {
    return this.conversationsService.list(shopId, includeDeleted === "true");
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.conversationsService.detail(id);
  }
}
