import { describe, it, expect, beforeEach, vi } from "vitest";
import { CSPReportController } from "../csp-report.controller";

// Mock the security logger
vi.mock("../../logging/logger", () => ({
  securityLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { securityLogger } from "../../logging/logger";

describe("CSPReportController", () => {
  let controller: CSPReportController;

  beforeEach(() => {
    controller = new CSPReportController();
    vi.clearAllMocks();
  });

  describe("handleCSPReport", () => {
    it("should log a valid CSP violation report", () => {
      const report = {
        "csp-report": {
          "document-uri": "https://example.com/page",
          "blocked-uri": "https://malicious.com/script.js",
          "violated-directive": "script-src",
          "effective-directive": "script-src",
          "source-file": "https://example.com/page",
          "line-number": 42,
          "column-number": 10,
          disposition: "enforce" as const,
        },
      };

      controller.handleCSPReport(report);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "CSP Violation Detected",
        expect.objectContaining({
          component: "CSPReportController",
          operation: "handleCSPReport",
          documentUri: "https://example.com/page",
          blockedUri: "https://malicious.com/script.js",
          violatedDirective: "script-src",
        }),
      );
    });

    it("should handle report with minimal data", () => {
      const report = {
        "csp-report": {
          "document-uri": "https://example.com",
          "violated-directive": "default-src",
        },
      };

      controller.handleCSPReport(report);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "CSP Violation Detected",
        expect.objectContaining({
          documentUri: "https://example.com",
          violatedDirective: "default-src",
        }),
      );
    });

    it("should warn about malformed reports without csp-report key", () => {
      const malformedReport = {
        someOtherKey: "value",
      };

      controller.handleCSPReport(malformedReport as any);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "Received malformed CSP report",
        expect.objectContaining({
          component: "CSPReportController",
          operation: "handleCSPReport",
        }),
      );
    });

    it("should handle empty csp-report object", () => {
      const emptyReport = {
        "csp-report": {},
      };

      controller.handleCSPReport(emptyReport as any);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "CSP Violation Detected",
        expect.objectContaining({
          component: "CSPReportController",
          documentUri: undefined,
          blockedUri: undefined,
        }),
      );
    });

    it("should truncate long script samples", () => {
      const report = {
        "csp-report": {
          "document-uri": "https://example.com",
          "violated-directive": "script-src",
          "script-sample": "A".repeat(200), // Very long sample
        },
      };

      controller.handleCSPReport(report);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "CSP Violation Detected",
        expect.objectContaining({
          scriptSample: "A".repeat(100), // Should be truncated to 100 chars
        }),
      );
    });

    it("should handle report disposition field", () => {
      const reportModeReport = {
        "csp-report": {
          "document-uri": "https://example.com",
          "violated-directive": "script-src",
          disposition: "report" as const,
        },
      };

      controller.handleCSPReport(reportModeReport);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "CSP Violation Detected",
        expect.objectContaining({
          disposition: "report",
        }),
      );
    });

    it("should default disposition to enforce when not provided", () => {
      const noDispositionReport = {
        "csp-report": {
          "document-uri": "https://example.com",
          "violated-directive": "script-src",
        },
      };

      controller.handleCSPReport(noDispositionReport);

      expect(securityLogger.warn).toHaveBeenCalledWith(
        "CSP Violation Detected",
        expect.objectContaining({
          disposition: "enforce",
        }),
      );
    });
  });
});
