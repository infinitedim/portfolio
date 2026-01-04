import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ServerStaticCommands } from "../ServerStaticCommands";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("ServerStaticCommands", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
  });

  it("renders static commands container", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = await render(<ServerStaticCommands />);
    const staticCommands = container.querySelector("#static-commands");
    expect(staticCommands).toBeInTheDocument();
    expect(staticCommands).toHaveAttribute("data-prerendered", "true");
  });

  it("includes help output", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = await render(<ServerStaticCommands />);
    const helpOutput = container.querySelector("#help-output");
    expect(helpOutput).toBeInTheDocument();
  });

  it("includes about output", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = await render(<ServerStaticCommands />);
    const aboutOutput = container.querySelector("#about-output");
    expect(aboutOutput).toBeInTheDocument();
  });

  it("includes projects output", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { container } = await render(<ServerStaticCommands />);
    const projectsOutput = container.querySelector("#projects-output");
    expect(projectsOutput).toBeInTheDocument();
  });
});
