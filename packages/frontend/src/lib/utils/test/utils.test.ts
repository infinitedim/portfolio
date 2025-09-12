import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, generateId, formatTimestamp } from "../utils";

describe("utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("cn function", () => {
    it("should be defined and exportable", () => {
      expect(cn).toBeDefined();
      expect(typeof cn).toBe("function");
    });

    it("should merge class names correctly", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      // eslint-disable-next-line no-constant-binary-expression
      const result = cn("base", true && "conditional", false && "not-included");
      expect(result).toBe("base conditional");
    });

    it("should handle arrays of classes", () => {
      const result = cn(["class1", "class2"], "class3");
      expect(result).toBe("class1 class2 class3");
    });

    it("should handle objects with boolean values", () => {
      const result = cn({
        class1: true,
        class2: false,
        class3: true,
      });
      expect(result).toBe("class1 class3");
    });

    it("should handle empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle null and undefined", () => {
      const result = cn(null, undefined, "valid-class");
      expect(result).toBe("valid-class");
    });

    it("should handle Tailwind CSS classes merging", () => {
      const result = cn("p-4", "p-2");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });

    it("should handle complex class combinations", () => {
      const result = cn(
        "base-class",
        ["array-class1", "array-class2"],
        { "object-class": true, "hidden-class": false },
        // eslint-disable-next-line no-constant-binary-expression
        true && "conditional-class",
      );
      expect(result).toContain("base-class");
      expect(result).toContain("array-class1");
      expect(result).toContain("array-class2");
      expect(result).toContain("object-class");
      expect(result).toContain("conditional-class");
      expect(result).not.toContain("hidden-class");
    });
  });

  describe("generateId function", () => {
    it("should be defined and exportable", () => {
      expect(generateId).toBeDefined();
      expect(typeof generateId).toBe("function");
    });

    it("should generate a string ID", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should contain underscore separator", () => {
      const id = generateId();
      expect(id).toContain("_");
    });

    it("should have two parts separated by underscore", () => {
      const id = generateId();
      const parts = id.split("_");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it("should generate different IDs on multiple calls", () => {
      const ids = Array.from({ length: 5 }, () => generateId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it("should use base36 encoding", () => {
      const id = generateId();
      const parts = id.split("_");
      // Base36 characters are 0-9 and a-z
      const base36Regex = /^[0-9a-z]+$/;
      expect(base36Regex.test(parts[0])).toBe(true);
      expect(base36Regex.test(parts[1])).toBe(true);
    });
  });

  describe("formatTimestamp function", () => {
    it("should be defined and exportable", () => {
      expect(formatTimestamp).toBeDefined();
      expect(typeof formatTimestamp).toBe("function");
    });

    it("should format Date object correctly", () => {
      const date = new Date("2024-01-15T10:30:45.123Z");
      const result = formatTimestamp(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it("should format timestamp number correctly", () => {
      const timestamp = new Date("2024-01-15T10:30:45.123Z").getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it("should format specific date correctly", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");
      const result = formatTimestamp(date);
      expect(result).toContain("2024-01-01");
    });

    it("should pad single digits with zeros", () => {
      const date = new Date("2024-01-05T09:08:07.000Z");
      const result = formatTimestamp(date);
      expect(result).toContain("01-05");
      expect(result).toContain("09:08:07");
    });

    it("should handle different months correctly", () => {
      const dates = [
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2024-12-31T23:59:59.000Z"),
      ];

      dates.forEach((date) => {
        const result = formatTimestamp(date);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      });
    });

    it("should handle leap year correctly", () => {
      const leapYearDate = new Date("2024-02-29T12:00:00.000Z");
      const result = formatTimestamp(leapYearDate);
      expect(result).toContain("2024-02-29");
    });

    it("should handle edge cases", () => {
      const edgeCases = [
        new Date("2024-12-31T23:59:59.999Z"),
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2024-06-15T12:30:45.500Z"),
      ];

      edgeCases.forEach((date) => {
        const result = formatTimestamp(date);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        expect(result.length).toBe(19); // "YYYY-MM-DD HH:MM:SS" format
      });
    });

    it("should handle both Date and number inputs consistently", () => {
      const date = new Date("2024-06-15T12:30:45.000Z");
      const timestamp = date.getTime();

      const dateResult = formatTimestamp(date);
      const timestampResult = formatTimestamp(timestamp);

      expect(dateResult).toBe(timestampResult);
    });

    it("should return proper format structure", () => {
      const result = formatTimestamp(new Date());
      const parts = result.split(" ");
      expect(parts).toHaveLength(2);

      const datePart = parts[0];
      const timePart = parts[1];

      expect(datePart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(timePart).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });
});
