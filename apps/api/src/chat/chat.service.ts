import { BadRequestException, Injectable } from "@nestjs/common";
import { AiService, type ChatMessageInput } from "@app/ai";
import type { ChatCompleteDto } from "./dto/chat-complete.dto";

@Injectable()
export class ChatService {
  constructor(private readonly aiService: AiService) {}

  async complete(dto: ChatCompleteDto): Promise<{ content: string }> {
    const lastUser = this.getLastUserMessage(dto.messages);
    if (!lastUser) {
      throw new BadRequestException(
        "messages phải chứa ít nhất một tin nhắn role=user",
      );
    }

    const convo: ChatMessageInput[] = dto.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const content = await this.aiService.completeWithRag({
      shopId: dto.shopId,
      messages: convo,
    });

    return { content };
  }

  private getLastUserMessage(
    messages: ChatCompleteDto["messages"],
  ): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i].content;
      }
    }
    return undefined;
  }
}

