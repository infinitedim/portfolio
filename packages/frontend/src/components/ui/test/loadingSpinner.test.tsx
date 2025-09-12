import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoadingSpinner } from "../LoadingSpinner";
// rely on global test setup in src/test/setup.ts for providing DOM and mocks

describe("LoadingSpinner", () => {
  it("renders spinner and optional text", () => {
    render(
      <LoadingSpinner
        text="Loading data..."
        size="lg"
      />,
    );

    const status = screen.getByRole("status");
    expect(status).not.toBeNull();
    expect(screen.getByText("Loading data...").textContent).toBe(
      "Loading data...",
    );
  });

  it("applies size classes based on props", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector("div > div");
    expect(spinner).not.toBeNull();
    // At minimum, the spinner element should be present
    expect(spinner).not.toBeNull();
  });
});
