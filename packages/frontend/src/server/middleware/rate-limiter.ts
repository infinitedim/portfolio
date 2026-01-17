import { NextRequest, NextResponse } from "next/server";
import { securityService } from "../services";

export function withRateLimit(type: "login" | "api" | "aiChat" = "api") {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const result = await securityService.checkRateLimit(ip, type);

      if (result.isBlocked) {
        return NextResponse.json(
          { error: result.message },
          {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfter || 60),
            },
          },
        );
      }

      return handler(request);
    };
  };
}

