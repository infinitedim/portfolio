import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { securityLogger } from "../logging/logger";

/**
 * CSP Report Schema
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only
 */
interface CSPReport {
  "csp-report"?: {
    "document-uri"?: string;
    referrer?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    "blocked-uri"?: string;
    "status-code"?: number;
    "script-sample"?: string;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    disposition?: "enforce" | "report";
  };
}

@Controller("api")
export class CSPReportController {
  /**
   * Receive CSP violation reports
   * This endpoint receives reports when browsers detect CSP violations
   */
  @Post("csp-report")
  @HttpCode(HttpStatus.NO_CONTENT)
  handleCSPReport(@Body() report: CSPReport): void {
    const cspReport = report["csp-report"];

    if (!cspReport) {
      securityLogger.warn("Received malformed CSP report", {
        component: "CSPReportController",
        operation: "handleCSPReport",
        rawReport: JSON.stringify(report).substring(0, 500), // Limit size
      });
      return;
    }

    // Log CSP violation for monitoring and analysis
    securityLogger.warn("CSP Violation Detected", {
      component: "CSPReportController",
      operation: "handleCSPReport",
      documentUri: cspReport["document-uri"],
      blockedUri: cspReport["blocked-uri"],
      violatedDirective: cspReport["violated-directive"],
      effectiveDirective: cspReport["effective-directive"],
      sourceFile: cspReport["source-file"],
      lineNumber: cspReport["line-number"],
      columnNumber: cspReport["column-number"],
      disposition: cspReport.disposition || "enforce",
      scriptSample: cspReport["script-sample"]?.substring(0, 100), // Limit sample size
    });

    // In production, you might want to:
    // 1. Send alerts for certain violation patterns
    // 2. Store reports in a database for trend analysis
    // 3. Rate limit to prevent report flooding attacks
  }
}
