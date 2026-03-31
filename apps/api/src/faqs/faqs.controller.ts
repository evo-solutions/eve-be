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
import { FaqsService } from "./faqs.service";
import { CreateFaqsDto } from "./dto/create-faqs.dto";
import { UpdateFaqsDto } from "./dto/update-faqs.dto";
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

@Controller("faqs")
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post("create")
  create(@Body() dto: CreateFaqsDto) {
    return this.faqsService.createMany(dto);
  }

  @Patch("update")
  update(@Body() dto: UpdateFaqsDto) {
    return this.faqsService.updateMany(dto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.faqsService.deleteMany(dto.ids);
  }

  @Get()
  list(
    @Query("shopId") shopId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.faqsService
      .list({
        shopId,
        includeDeleted: includeDeleted === "true",
        cursor: parseCursorToken(cursor),
        limit: limit ? Number(limit) : undefined,
        search,
      })
      .then((result) => ({
        items: result.items,
        nextCursor: toCursorToken(result.nextCursor),
      }));
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.faqsService.detail(id);
  }
}
