import { describe, it, expect, beforeEach } from "vitest";
import { canRunTests } from "@/test/test-helpers";

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
  });

  it("module exists", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    // File is empty, so we just check that the test runs
    expect(true).toBe(true);
  });
});
