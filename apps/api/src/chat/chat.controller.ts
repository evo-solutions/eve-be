import { Body, Controller, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatCompleteDto } from "./dto/chat-complete.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Nhận shopId + lịch sử tin nhắn, RAG từ embeddings cửa hàng, gọi AI và trả nội dung trả lời.
   */
  @Post("complete")
  complete(@Body() dto: ChatCompleteDto) {
    return this.chatService.complete(dto);
  }
}

