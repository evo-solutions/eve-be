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
import { FaqsService } from "./faqs.service";
import { CreateFaqsDto } from "./dto/create-faqs.dto";
import { UpdateFaqItemDto } from "./dto/update-faqs.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";
import { ListFaqsDto } from "./dto/list-faqs.dto";

@Controller("faqs")
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) { }

  @Post("create")
  create(@Body() dto: CreateFaqsDto) {
    return this.faqsService.createMany(dto);
  }

  @Put(":id")
  updateOne(@Param("id") id: string, @Body() body: Omit<UpdateFaqItemDto, "id">) {
    return this.faqsService.updateOne(id, body as UpdateFaqItemDto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.faqsService.deleteMany(dto.ids);
  }

  @Get()
  list(@Query() query: ListFaqsDto) {
    const { shopId, includeDeleted, limit, search } = query;
    return this.faqsService.list({
      shopId,
      includeDeleted: includeDeleted === "true",
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.faqsService.detail(id);
  }
}
