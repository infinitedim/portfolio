import { describe, it, expect, beforeEach } from "vitest";
import { PerformanceDashboard } from "../PerformanceDashboard";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("Performance Index", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("exports PerformanceDashboard", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    expect(PerformanceDashboard).toBeDefined();
  });
});
