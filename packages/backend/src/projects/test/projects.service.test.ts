import { ProjectsService } from "../projects.service";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      $transaction: vi.fn(),
      project: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    // Create service directly with mocked PrismaService
    service = new ProjectsService(mockPrismaService);
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

      const mockCount = 2;

      mockPrismaService.$transaction.mockResolvedValue([
        mockProjects,
        mockCount,
      ]);

      const result = await service.list();

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        mockPrismaService.project.findMany({
          skip: 0,
          take: 12,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            tech: true,
            featured: true,
          },
        }),
        mockPrismaService.project.count(),
      ]);

      expect(result).toEqual({
        items: mockProjects,
        page: 1,
        pageSize: 12,
        total: mockCount,
      });
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

      const mockCount = 1;

      mockPrismaService.$transaction.mockResolvedValue([
        mockProjects,
        mockCount,
      ]);

      const result = await service.list(2, 5);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        mockPrismaService.project.findMany({
          skip: 5, // (2 - 1) * 5
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            tech: true,
            featured: true,
          },
        }),
        mockPrismaService.project.count(),
      ]);

      expect(result).toEqual({
        items: mockProjects,
        page: 2,
        pageSize: 5,
        total: mockCount,
      });
    });

    it("should handle empty results", async () => {
      const mockProjects: any[] = [];
      const mockCount = 0;

      mockPrismaService.$transaction.mockResolvedValue([
        mockProjects,
        mockCount,
      ]);

      const result = await service.list();

      expect(result).toEqual({
        items: [],
        page: 1,
        pageSize: 12,
        total: 0,
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockPrismaService.$transaction.mockRejectedValue(error);

      await expect(service.list()).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getBySlug", () => {
    it("should return project by slug", async () => {
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

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.getBySlug("project-1");

      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { slug: "project-1" },
      });

      expect(result).toEqual(mockProject);
    });

    it("should return null for non-existent slug", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      const result = await service.getBySlug("non-existent-project");

      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { slug: "non-existent-project" },
      });

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockPrismaService.project.findUnique.mockRejectedValue(error);

      await expect(service.getBySlug("project-1")).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle empty slug", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      const result = await service.getBySlug("");

      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { slug: "" },
      });

      expect(result).toBeNull();
    });
  });
});
