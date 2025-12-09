import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import type { Response } from "express";
import type { CoreMessage } from "ai";
import { z } from "zod";
import { Throttle } from "@nestjs/throttler";

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "data"]),
      content: z.any(), // Content can be string or complex parts, keeping it flexible for now
    }),
  ),
});

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Stricter limit for AI: 10 req/min
  async chat(@Body() body: unknown, @Res() res: Response) {
    const result = chatSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException("Invalid request body");
    }

    const response = await this.aiService.streamChat(
      result.data.messages as CoreMessage[],
    );

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const reader = response.body?.getReader();
    if (!reader) {
      throw new BadRequestException("No response body");
    }

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(value);
      return pump();
    };

    await pump();
  }
}
