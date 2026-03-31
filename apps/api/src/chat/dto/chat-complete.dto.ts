import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class ChatMessageDto {
  @IsIn(["assistant", "user"])
  role: "assistant" | "user";

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatCompleteDto {
  @IsUUID()
  shopId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
