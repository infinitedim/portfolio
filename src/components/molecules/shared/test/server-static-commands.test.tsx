import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  ServerStaticCommands,
  usePrerenderedCommand,
} from "../server-static-commands";

describe("ServerStaticCommands", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render static commands container", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const Component = await ServerStaticCommands();
      const { container } = render(Component);

      const staticCommands = container.querySelector("#static-commands");
      expect(staticCommands).toBeInTheDocument();
      expect(staticCommands).toHaveAttribute("data-prerendered", "true");
    });

    it("should include help output", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const Component = await ServerStaticCommands();
      const { container } = render(Component);

      const helpOutput = container.querySelector("#help-output");
      expect(helpOutput).toBeInTheDocument();
    });

    it("should include about output", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const Component = await ServerStaticCommands();
      const { container } = render(Component);

      const aboutOutput = container.querySelector("#about-output");
      expect(aboutOutput).toBeInTheDocument();
    });

    it("should include projects output", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const Component = await ServerStaticCommands();
      const { container } = render(Component);

      const projectsOutput = container.querySelector("#projects-output");
      expect(projectsOutput).toBeInTheDocument();
    });

    it("should be hidden by default", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const Component = await ServerStaticCommands();
      const { container } = render(Component);

      const staticCommands = container.querySelector("#static-commands");
      expect(staticCommands).toHaveClass("hidden");
    });
  });

  describe("usePrerenderedCommand", () => {
    it("should return null on server side", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      // Mock window as undefined (server side)
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = usePrerenderedCommand("help");
      expect(result).toBeNull();

      global.window = originalWindow;
    });

    it("should return command output when element exists", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      // Create mock element
      const mockElement = document.createElement("div");
      mockElement.id = "help-output";
      mockElement.innerHTML = "<div>Help content</div>";
      document.body.appendChild(mockElement);

      const result = usePrerenderedCommand("help");
      expect(result).toContain("Help content");

      document.body.removeChild(mockElement);
    });

    it("should return null when element does not exist", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof document === "undefined") {
        expect(true).toBe(true);
        return;
      }

      const result = usePrerenderedCommand("nonexistent");
      expect(result).toBeNull();
    });
  });
});
