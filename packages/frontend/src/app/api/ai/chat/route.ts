import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/server/services";
import { securityService } from "@/server/services";

// Define message type compatible with ai package
type Message = {
  role: "system" | "user" | "assistant" | "data";
  content: string | unknown;
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    const rateLimit = await securityService.checkRateLimit(clientIp, "aiChat");
    if (rateLimit.isBlocked) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }

    // Parse request body
    const body = await request.json();
    const messages: Message[] = body.messages || [];

    if (!messages.length) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    // Stream response
    return aiService.streamChat(messages as any);
  } catch (error) {
    console.error("[AI Chat Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

