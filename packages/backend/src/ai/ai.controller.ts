import { Controller, Post, Body, Res, UsePipes, BadRequestException } from "@nestjs/common";
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
    })
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

    const response = await this.aiService.streamChat(result.data.messages as CoreMessage[]);
    
    // Pipe the stream to the response
    // @ts-ignore - Vercel AI SDK response type compatibility
    response.pipe(res);
  }
}
