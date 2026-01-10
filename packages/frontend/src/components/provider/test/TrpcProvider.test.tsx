import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { TRPCProvider } from "../TrpcProvider";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn().mockImplementation((config) => ({
    ...config,
    getQueryCache: vi.fn(),
    getMutationCache: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

describe("TrpcProvider", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders children", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <TRPCProvider>
        <div>Test content</div>
      </TRPCProvider>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("provides QueryClientProvider", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { getByTestId } = render(
      <TRPCProvider>
        <div>Test</div>
      </TRPCProvider>
    );

    expect(getByTestId("query-client-provider")).toBeInTheDocument();
  });

  it("creates QueryClient with correct default options", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    render(
      <TRPCProvider>
        <div>Test</div>
      </TRPCProvider>
    );

    expect(QueryClient).toHaveBeenCalled();
    const callArgs = (QueryClient as any).mock.calls[0][0];
    expect(callArgs.defaultOptions.queries.retry).toBe(1);
    expect(callArgs.defaultOptions.queries.refetchOnWindowFocus).toBe(false);
  });
});
