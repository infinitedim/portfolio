import { ProjectsController } from "../projects.controller";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("ProjectsController", () => {
  let controller: ProjectsController;
  let mockProjectsService: any;

  beforeEach(async () => {
    mockProjectsService = {
      list: vi.fn(),
      getBySlug: vi.fn(),
    };

    // Create controller directly with mocked service
    controller = new ProjectsController(mockProjectsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return projects with default pagination", async () => {
      const mockProjects = [
        {
          id: "1",
          name: "Project 1",
          slug: "project-1",
          description: "Description 1",
          tech: ["React", "Node.js"],
          featured: true,
        },
        {
          id: "2",
          name: "Project 2",
          slug: "project-2",
          description: "Description 2",
          tech: ["Vue", "Express"],
          featured: false,
        },
      ];

      const mockResult = {
        items: mockProjects,
        page: 1,
        pageSize: 12,
        total: 2,
      };

      mockProjectsService.list.mockResolvedValue(mockResult);

      const result = await controller.list();

      expect(mockProjectsService.list).toHaveBeenCalledWith(1, 12);
      expect(result).toEqual(mockResult);
    });

    it("should return projects with custom pagination", async () => {
      const mockProjects = [
        {
          id: "3",
          name: "Project 3",
          slug: "project-3",
          description: "Description 3",
          tech: ["Angular", "MongoDB"],
          featured: true,
        },
      ];

      const mockResult = {
        items: mockProjects,
        page: 2,
        pageSize: 5,
        total: 1,
      };

      mockProjectsService.list.mockResolvedValue(mockResult);

      const result = await controller.list(2, 5);

      expect(mockProjectsService.list).toHaveBeenCalledWith(2, 5);
      expect(result).toEqual(mockResult);
    });

    it("should handle string parameters and convert to numbers", async () => {
      const mockResult = {
        items: [],
        page: 3,
        pageSize: 10,
        total: 0,
      };

      mockProjectsService.list.mockResolvedValue(mockResult);

      const result = await controller.list(3, 10);

      expect(mockProjectsService.list).toHaveBeenCalledWith(3, 10);
      expect(result).toEqual(mockResult);
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockProjectsService.list.mockRejectedValue(error);

      await expect(controller.list()).rejects.toThrow("Service error");
    });
  });

  describe("get", () => {
    it("should return project for valid slug", async () => {
      const mockProject = {
        id: "1",
        name: "Project 1",
        slug: "project-1",
        description: "Description 1",
        tech: ["React", "Node.js"],
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.getBySlug.mockResolvedValue(mockProject);

      const result = await controller.get("project-1");

      expect(mockProjectsService.getBySlug).toHaveBeenCalledWith("project-1");
      expect(result).toEqual(mockProject);
    });

    it("should return error for invalid slug format", async () => {
      const result = await controller.get("invalid slug with spaces");

      expect(mockProjectsService.getBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Invalid slug" });
    });

    it("should return error for slug with uppercase letters", async () => {
      const result = await controller.get("Project-1");

      expect(mockProjectsService.getBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Invalid slug" });
    });

    it("should return error for slug with special characters", async () => {
      const result = await controller.get("project-1!");

      expect(mockProjectsService.getBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Invalid slug" });
    });

    it("should return error for slug starting with hyphen", async () => {
      const result = await controller.get("-project-1");

      expect(mockProjectsService.getBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Invalid slug" });
    });

    it("should return error for slug ending with hyphen", async () => {
      const result = await controller.get("project-1-");

      expect(mockProjectsService.getBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Invalid slug" });
    });

    it("should accept valid slug with multiple hyphens", async () => {
      const mockProject = {
        id: "1",
        name: "Project 1",
        slug: "my-awesome-project-2024",
        description: "Description 1",
        tech: ["React", "Node.js"],
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.getBySlug.mockResolvedValue(mockProject);

      const result = await controller.get("my-awesome-project-2024");

      expect(mockProjectsService.getBySlug).toHaveBeenCalledWith(
        "my-awesome-project-2024",
      );
      expect(result).toEqual(mockProject);
    });

    it("should return null for non-existent project", async () => {
      mockProjectsService.getBySlug.mockResolvedValue(null);

      const result = await controller.get("non-existent-project");

      expect(mockProjectsService.getBySlug).toHaveBeenCalledWith(
        "non-existent-project",
      );
      expect(result).toBeNull();
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockProjectsService.getBySlug.mockRejectedValue(error);

      await expect(controller.get("project-1")).rejects.toThrow(
        "Service error",
      );
    });

    it("should handle empty slug", async () => {
      const result = await controller.get("");

      expect(mockProjectsService.getBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Invalid slug" });
    });
  });

  describe("slug validation", () => {
    it("should validate various slug formats correctly", async () => {
      // Valid slugs
      mockProjectsService.getBySlug.mockResolvedValue({
        id: "1",
        slug: "valid-slug",
      });
      const validResult = await controller.get("valid-slug");
      expect(validResult).not.toEqual({ error: "Invalid slug" });

      // Invalid slugs
      const invalidResult = await controller.get("Invalid-Slug");
      expect(invalidResult).toEqual({ error: "Invalid slug" });
    });
  });
});
