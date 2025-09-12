import { BlogService } from "../blog.service";
import { NotFoundException } from "@nestjs/common";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { PrismaService } from "../../prisma/prisma.service";

// Mock PrismaService
const mockPrismaService = {
  blogPost: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe("BlogService", () => {
  let service: BlogService;

  beforeEach(async () => {
    // Create service instance directly with mocked dependencies
    service = new BlogService(mockPrismaService as unknown as PrismaService);

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a blog post with all fields", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
        content: "Test content",
        contentHtml: "<p>Test content</p>",
        published: true,
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: "<p>Test content</p>" },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it("should create a blog post with minimal required fields", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        content: "",
        contentHtml: undefined,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: undefined },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it("should sanitize HTML content when provided", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
        contentHtml: "<script>alert('xss')</script><p>Safe content</p>",
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        contentHtml: "<p>Safe content</p>",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: "<p>Safe content</p>" },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it("should not include contentHtml when not provided", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        contentHtml: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: undefined },
      });
      expect(result).toEqual(mockCreatedPost);
    });
  });

  describe("update", () => {
    it("should update a blog post successfully", async () => {
      const slug = "test-post";
      const updateData = {
        title: "Updated Post",
        content: "Updated content",
      };
      const existingPost = {
        id: 1,
        slug,
        title: "Original Post",
        content: "Original content",
      };
      const mockUpdatedPost = {
        ...existingPost,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.blogPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.update(slug, updateData);

      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith({
        where: { slug },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedPost);
    });

    it("should update a blog post with partial data", async () => {
      const slug = "test-post";
      const updateData = {
        title: "Updated Post",
      };
      const existingPost = {
        id: 1,
        slug,
        title: "Original Post",
        content: "Original content",
      };
      const mockUpdatedPost = {
        ...existingPost,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.blogPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.update(slug, updateData);

      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith({
        where: { slug },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedPost);
    });

    it("should sanitize HTML content when updating", async () => {
      const slug = "test-post";
      const updateData = {
        contentHtml: "<script>alert('xss')</script><p>Safe content</p>",
      };
      const existingPost = {
        id: 1,
        slug,
        title: "Original Post",
      };
      const mockUpdatedPost = {
        ...existingPost,
        contentHtml: "<p>Safe content</p>",
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.blogPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.update(slug, updateData);

      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith({
        where: { slug },
        data: { contentHtml: "<p>Safe content</p>" },
      });
      expect(result).toEqual(mockUpdatedPost);
    });

    it("should throw NotFoundException when post does not exist", async () => {
      const slug = "non-existent-post";
      const updateData = {
        title: "Updated Post",
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.update(slug, updateData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(mockPrismaService.blogPost.update).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should find a blog post by slug", async () => {
      const slug = "test-post";
      const mockPost = {
        id: 1,
        title: "Test Post",
        slug,
        content: "Test content",
        published: true,
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne(slug);

      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(result).toEqual(mockPost);
    });

    it("should return null when post does not exist", async () => {
      const slug = "non-existent-post";

      mockPrismaService.blogPost.findUnique.mockResolvedValue(null);

      const result = await service.findOne(slug);

      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(result).toBeNull();
    });
  });

  describe("list", () => {
    it("should return paginated blog posts with default parameters", async () => {
      const mockPosts = [
        { id: 1, title: "Post 1", slug: "post-1" },
        { id: 2, title: "Post 2", slug: "post-2" },
      ];
      const mockTotal = 2;

      mockPrismaService.$transaction.mockResolvedValue([mockPosts, mockTotal]);

      const result = await service.list();

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        mockPrismaService.blogPost.findMany({
          skip: 0,
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
        mockPrismaService.blogPost.count(),
      ]);
      expect(result).toEqual({
        items: mockPosts,
        page: 1,
        pageSize: 10,
        total: mockTotal,
      });
    });

    it("should return paginated blog posts with custom parameters", async () => {
      const mockPosts = [{ id: 1, title: "Post 1", slug: "post-1" }];
      const mockTotal = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockPosts, mockTotal]);

      const result = await service.list(2, 5);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        mockPrismaService.blogPost.findMany({
          skip: 5,
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        mockPrismaService.blogPost.count(),
      ]);
      expect(result).toEqual({
        items: mockPosts,
        page: 2,
        pageSize: 5,
        total: mockTotal,
      });
    });

    it("should handle empty results", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      const result = await service.list();

      expect(result).toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });
    });

    it("should handle pagination edge cases", async () => {
      const mockPosts = [];
      const mockTotal = 0;

      mockPrismaService.$transaction.mockResolvedValue([mockPosts, mockTotal]);

      const result = await service.list(0, 0);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        mockPrismaService.blogPost.findMany({
          skip: -10,
          take: 0,
          orderBy: { createdAt: "desc" },
        }),
        mockPrismaService.blogPost.count(),
      ]);
      expect(result).toEqual({
        items: mockPosts,
        page: 0,
        pageSize: 0,
        total: mockTotal,
      });
    });
  });

  describe("delete", () => {
    it("should delete a blog post successfully", async () => {
      const slug = "test-post";
      const mockDeletedPost = {
        id: 1,
        title: "Deleted Post",
        slug,
        deletedAt: new Date(),
      };

      mockPrismaService.blogPost.delete.mockResolvedValue(mockDeletedPost);

      const result = await service.delete(slug);

      expect(mockPrismaService.blogPost.delete).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(result).toEqual(mockDeletedPost);
    });

    it("should throw error when post does not exist", async () => {
      const slug = "non-existent-post";

      mockPrismaService.blogPost.delete.mockRejectedValue(
        new Error("Record to delete does not exist"),
      );

      await expect(service.delete(slug)).rejects.toThrow(
        "Record to delete does not exist",
      );
      expect(mockPrismaService.blogPost.delete).toHaveBeenCalledWith({
        where: { slug },
      });
    });
  });

  describe("HTML sanitization", () => {
    it("should sanitize dangerous HTML content in create", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
        contentHtml: "<script>alert('xss')</script><p>Safe content</p>",
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        contentHtml: "<p>Safe content</p>",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: "<p>Safe content</p>" },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it("should sanitize dangerous HTML content in update", async () => {
      const slug = "test-post";
      const updateData = {
        contentHtml: "<script>alert('xss')</script><p>Safe content</p>",
      };
      const existingPost = {
        id: 1,
        slug,
        title: "Original Post",
      };
      const mockUpdatedPost = {
        ...existingPost,
        contentHtml: "<p>Safe content</p>",
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.blogPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.update(slug, updateData);

      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith({
        where: { slug },
        data: { contentHtml: "<p>Safe content</p>" },
      });
      expect(result).toEqual(mockUpdatedPost);
    });

    it("should handle undefined contentHtml gracefully", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        contentHtml: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: undefined },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it("should handle empty string contentHtml", async () => {
      const createData = {
        title: "Test Post",
        slug: "test-post",
        contentHtml: "",
      };
      const mockCreatedPost = {
        id: 1,
        ...createData,
        contentHtml: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createData);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith({
        data: { ...createData, contentHtml: undefined },
      });
      expect(result).toEqual(mockCreatedPost);
    });
  });
});
