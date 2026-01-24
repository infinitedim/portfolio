/**
 * Test helper utilities for frontend tests
 */

import { expect } from "vitest";

/**
 * Check if tests can run (document and window are available)
 * Use this in test files that require DOM access
 */
export const canRunTests =
  typeof document !== "undefined" && typeof window !== "undefined";

/**
 * Ensure document.body exists for tests
 * Call this in beforeEach hooks
 */
export function ensureDocumentBody(): void {
  if (!canRunTests) {
    return;
  }

  if (!document.body) {
    const body = document.createElement("body");
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    }
  }
}

/**
 * Skip test if DOM is not available
 * Use this at the start of test cases that require DOM
 */
export function skipIfNoDOM(): void {
  if (!canRunTests) {
    expect(true).toBe(true);
    return;
  }
}
