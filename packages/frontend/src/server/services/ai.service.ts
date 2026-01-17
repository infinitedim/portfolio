import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

// Define message type compatible with ai package
type Message = {
  role: "system" | "user" | "assistant" | "data";
  content: string | unknown;
};
import { getAIConfig } from "../config";
import { apiLogger } from "../utils";

const SYSTEM_PROMPT = `You are a helpful, professional, and slightly witty terminal assistant for a developer portfolio.
Your goal is to help visitors navigate the portfolio, understand the developer's skills, and provide context about the projects.

Tone:
- Professional but approachable.
- Occasional tech humor or terminal-themed jokes are allowed.
- Concise responses (suitable for a terminal interface).

Context:
- This is a portfolio for a Full-Stack Developer.
- Tech stack: React, Next.js, TypeScript, Tailwind CSS.

If asked about specific projects or skills, try to be informative.
If you don't know something, admit it gracefully.`;

/**
 * Stream chat response from Claude
 */
export async function streamChat(messages: Message[]) {
  const config = getAIConfig();

  if (!config.anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }

  try {
    const result = streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      messages,
      system: SYSTEM_PROMPT,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    apiLogger.error("AI streamChat error", { error });
    throw error;
  }
}

/**
 * Non-streaming chat (for simple responses)
 */
export async function chat(messages: Message[]): Promise<string> {
  const config = getAIConfig();

  if (!config.anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }

  try {
    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      messages,
      system: SYSTEM_PROMPT,
    });

    const response = await result.text;
    return response;
  } catch (error) {
    apiLogger.error("AI chat error", { error });
    throw error;
  }
}

export const aiService = {
  streamChat,
  chat,
};

export type AIService = typeof aiService;

