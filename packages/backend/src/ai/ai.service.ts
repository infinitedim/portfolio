import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async streamChat(messages: CoreMessage[]) {
    try {
      const result = streamText({
        model: anthropic("claude-3-5-sonnet-20241022"),
        messages,
        system: `You are a helpful, professional, and slightly witty terminal assistant for a developer portfolio.
        Your goal is to help visitors navigate the portfolio, understand the developer's skills, and provide context about the projects.
        
        Tone:
        - Professional but approachable.
        - Occasional tech humor or terminal-themed jokes are allowed.
        - Concise responses (suitable for a terminal interface).
        
        Context:
        - This is a portfolio for a Full-Stack Developer.
        - Tech stack: React, Next.js, NestJS, TypeScript, Tailwind CSS.
        
        If asked about specific projects or skills, try to be informative.
        If you don't know something, admit it gracefully.`,
      });

      return result.toTextStreamResponse();
    } catch (error) {
      this.logger.error("Error in streamChat", error);
      throw error;
    }
  }
}
