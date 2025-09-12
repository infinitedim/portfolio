import { describe, it, expect, vi, beforeEach } from "vitest";
import { projectsRouter } from "../projects.router";

describe("projectsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("router structure", () => {
    it("should have get and update procedures", () => {
      expect(projectsRouter.get).toBeDefined();
      expect(projectsRouter.update).toBeDefined();
    });

    it("should have proper procedure structure", () => {
      expect(typeof projectsRouter.get).toBe("function");
      expect(typeof projectsRouter.update).toBe("function");
    });
  });

  describe("get procedure", () => {
    it("should have proper structure", () => {
      expect(projectsRouter.get).toBeDefined();
      expect(typeof projectsRouter.get).toBe("function");
    });
  });

  describe("update procedure", () => {
    it("should have proper structure", () => {
      expect(projectsRouter.update).toBeDefined();
      expect(typeof projectsRouter.update).toBe("function");
    });
  });
});
