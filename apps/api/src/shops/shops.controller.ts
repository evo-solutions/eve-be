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
import { ShopsService } from "./shops.service";
import { CreateShopsDto } from "./dto/create-shops.dto";
import { DeleteManyDto } from "./dto/delete-many.dto";
import { UpdateShopsDto } from "./dto/update-shops.dto";

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

@Controller("shops")
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post("create")
  create(@Body() dto: CreateShopsDto) {
    return this.shopsService.createMany(dto);
  }

  @Patch("update")
  update(@Body() dto: UpdateShopsDto) {
    return this.shopsService.updateMany(dto);
  }

  @Delete("delete")
  remove(@Body() dto: DeleteManyDto) {
    return this.shopsService.deleteMany(dto.ids);
  }

  @Get()
  list(
    @Query("userId") userId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.shopsService
      .list({
        userId,
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
    return this.shopsService.detail(id);
  }
}
