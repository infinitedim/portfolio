import { NextRequest, NextResponse } from "next/server";
import { auditLogService } from "@/server/services";

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    // Log CSP violation
    await auditLogService.logSecurityEvent(
      "csp_violation",
      report,
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 }); // Don't expose errors
  }
}

