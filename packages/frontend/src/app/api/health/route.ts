import { NextResponse } from "next/server";
import { healthService } from "@/server/services";

export async function GET() {
  try {
    const health = await healthService.checkHealth();

    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
          ? 200
          : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: "Health check failed" },
      { status: 503 },
    );
  }
}

