import { describe, it, expect } from "vitest";
import { TOUR_STEPS, TOUR_STORAGE_KEY, TOUR_VERSION, type TourStep } from "../tour-steps";

describe("tour-steps", () => {
  describe("TourStep Interface", () => {
    it("should have correct type structure", () => {
      const step: TourStep = {
        id: "test",
        title: "Test",
        content: "Test content",
        target: "#test",
        position: "top",
        action: "highlight",
        demoCommand: "test",
        icon: "🎯",
        tips: ["tip1"],
      };

      expect(step.id).toBe("test");
      expect(step.title).toBe("Test");
      expect(step.content).toBe("Test content");
      expect(step.target).toBe("#test");
      expect(step.position).toBe("top");
      expect(step.action).toBe("highlight");
      expect(step.demoCommand).toBe("test");
      expect(step.icon).toBe("🎯");
      expect(step.tips).toEqual(["tip1"]);
    });

    it("should allow optional properties", () => {
      const minimalStep: TourStep = {
        id: "test",
        title: "Test",
        content: "Test content",
        position: "center",
        icon: "🎯",
      };

      expect(minimalStep.target).toBeUndefined();
      expect(minimalStep.action).toBeUndefined();
      expect(minimalStep.demoCommand).toBeUndefined();
      expect(minimalStep.tips).toBeUndefined();
    });
  });

  describe("TOUR_STEPS", () => {
    it("should be an array", () => {
      expect(Array.isArray(TOUR_STEPS)).toBe(true);
    });

    it("should have at least one step", () => {
      expect(TOUR_STEPS.length).toBeGreaterThan(0);
    });

    it("should have welcome step as first step", () => {
      const firstStep = TOUR_STEPS[0];
      expect(firstStep.id).toBe("welcome");
      expect(firstStep.title).toContain("Welcome");
    });

    it("should have complete step as last step", () => {
      const lastStep = TOUR_STEPS[TOUR_STEPS.length - 1];
      expect(lastStep.id).toBe("complete");
    });

    it("should have all required properties for each step", () => {
      TOUR_STEPS.forEach((step) => {
        expect(step).toHaveProperty("id");
        expect(step).toHaveProperty("title");
        expect(step).toHaveProperty("content");
        expect(step).toHaveProperty("position");
        expect(step).toHaveProperty("icon");
        expect(typeof step.id).toBe("string");
        expect(typeof step.title).toBe("string");
        expect(typeof step.content).toBe("string");
        expect(typeof step.position).toBe("string");
        expect(typeof step.icon).toBe("string");
      });
    });

    it("should have valid position values", () => {
      const validPositions = ["top", "bottom", "left", "right", "center"];
      TOUR_STEPS.forEach((step) => {
        expect(validPositions).toContain(step.position);
      });
    });

    it("should have unique step IDs", () => {
      const ids = TOUR_STEPS.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have command-input step with target", () => {
      const commandInputStep = TOUR_STEPS.find((step) => step.id === "command-input");
      expect(commandInputStep).toBeDefined();
      expect(commandInputStep?.target).toBe("#command-input");
    });

    it("should have steps with demo commands", () => {
      const stepsWithDemo = TOUR_STEPS.filter((step) => step.demoCommand);
      expect(stepsWithDemo.length).toBeGreaterThan(0);
    });

    it("should have steps with tips", () => {
      const stepsWithTips = TOUR_STEPS.filter((step) => step.tips && step.tips.length > 0);
      expect(stepsWithTips.length).toBeGreaterThan(0);
    });
  });

  describe("Constants", () => {
    it("should export TOUR_STORAGE_KEY", () => {
      expect(TOUR_STORAGE_KEY).toBeDefined();
      expect(typeof TOUR_STORAGE_KEY).toBe("string");
      expect(TOUR_STORAGE_KEY).toBe("terminal-tour-completed");
    });

    it("should export TOUR_VERSION", () => {
      expect(TOUR_VERSION).toBeDefined();
      expect(typeof TOUR_VERSION).toBe("string");
      expect(TOUR_VERSION).toBe("1.0.0");
    });
  });

  describe("Step Content Quality", () => {
    it("should have non-empty titles", () => {
      TOUR_STEPS.forEach((step) => {
        expect(step.title.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty content", () => {
      TOUR_STEPS.forEach((step) => {
        expect(step.content.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty icons", () => {
      TOUR_STEPS.forEach((step) => {
        expect(step.icon.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have tips as arrays when provided", () => {
      TOUR_STEPS.forEach((step) => {
        if (step.tips) {
          expect(Array.isArray(step.tips)).toBe(true);
          expect(step.tips.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
