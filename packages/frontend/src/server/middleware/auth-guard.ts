import { NextRequest, NextResponse } from "next/server";
import { authService } from "../services";

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await authService.validateToken(authHeader.slice(7));
      return handler(request);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  };
}

