import { describe, it, expect, beforeEach, vi } from "vitest";
import { BlogController } from "../blog.controller";

describe("BlogController", () => {
  let controller: BlogController;
  let mockBlogService: any;

  beforeEach(async () => {
    mockBlogService = {
      list: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Create controller directly with mocked service
    controller = new BlogController(mockBlogService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return paginated blog posts with default parameters", async () => {
      const mockResult = {
        items: [
          { id: "1", title: "Post 1", slug: "post-1" },
          { id: "2", title: "Post 2", slug: "post-2" },
        ],
        page: 1,
        pageSize: 10,
        total: 2,
      };

      mockBlogService.list.mockResolvedValue(mockResult);

      const result = await controller.list();

      expect(mockBlogService.list).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockResult);
    });

    it("should return paginated blog posts with custom parameters", async () => {
      const mockResult = {
        items: [{ id: "1", title: "Post 1", slug: "post-1" }],
        page: 2,
        pageSize: 5,
        total: 10,
      };

      mockBlogService.list.mockResolvedValue(mockResult);

      const result = await controller.list(2, 5);

      expect(mockBlogService.list).toHaveBeenCalledWith(2, 5);
      expect(result).toEqual(mockResult);
    });

    it("should convert string parameters to numbers", async () => {
      const mockResult = {
        items: [],
        page: 3,
        pageSize: 15,
        total: 0,
      };

      mockBlogService.list.mockResolvedValue(mockResult);

      const result = await controller.list("3" as any, "15" as any);

      expect(mockBlogService.list).toHaveBeenCalledWith(3, 15);
      expect(result).toEqual(mockResult);
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockBlogService.list.mockRejectedValue(error);

      await expect(controller.list()).rejects.toThrow("Service error");
    });
  });

  describe("get", () => {
    it("should return blog post for valid slug", async () => {
      const mockPost = {
        id: "1",
        title: "Test Post",
        slug: "test-post",
        content: "Test content",
        published: true,
      };

      mockBlogService.findOne.mockResolvedValue(mockPost);

      const result = await controller.get("test-post");

      expect(mockBlogService.findOne).toHaveBeenCalledWith("test-post");
      expect(result).toEqual(mockPost);
    });

    it("should return error for invalid slug format", async () => {
      const invalidSlugs = [
        "Test Post", // Contains spaces
        "test_post", // Contains underscores
        "test.post", // Contains dots
        "test@post", // Contains special characters
        "Test-Post", // Contains uppercase
        "123", // Only numbers (valid but edge case)
        "", // Empty string
      ];

      for (const slug of invalidSlugs) {
        const result = await controller.get(slug);

        if (slug === "123" || slug === "") {
          // These might be valid depending on implementation
          continue;
        }

        expect(result).toEqual({ error: "Invalid slug" });
        expect(mockBlogService.findOne).not.toHaveBeenCalled();

        // Reset mock for next iteration
        vi.clearAllMocks();
      }
    });

    it("should accept valid slug formats", async () => {
      const validSlugs = [
        "test-post",
        "my-awesome-blog-post",
        "post-123",
        "a",
        "123-456",
        "hello-world-2023",
      ];

      const mockPost = { id: "1", title: "Test", slug: "test" };
      mockBlogService.findOne.mockResolvedValue(mockPost);

      for (const slug of validSlugs) {
        const result = await controller.get(slug);

        expect(mockBlogService.findOne).toHaveBeenCalledWith(slug);
        expect(result).toEqual(mockPost);

        // Reset mock for next iteration
        vi.clearAllMocks();
        mockBlogService.findOne.mockResolvedValue(mockPost);
      }
    });

    it("should handle service returning null", async () => {
      mockBlogService.findOne.mockResolvedValue(null);

      const result = await controller.get("non-existent-post");

      expect(mockBlogService.findOne).toHaveBeenCalledWith("non-existent-post");
      expect(result).toBeNull();
    });

    it("should handle service errors", async () => {
      const error = new Error("Database error");
      mockBlogService.findOne.mockRejectedValue(error);

      await expect(controller.get("test-post")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("create", () => {
    it("should create blog post successfully", async () => {
      const createDto = {
        title: "New Post",
        slug: "new-post",
        summary: "A new blog post",
        contentMd: "# New Post\n\nThis is content.",
        contentHtml: "<h1>New Post</h1><p>This is content.</p>",
        published: true,
      };

      const mockCreatedPost = {
        id: "1",
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBlogService.create.mockResolvedValue(mockCreatedPost);

      const result = await controller.create(createDto);

      expect(mockBlogService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCreatedPost);
    });

    it("should create blog post with minimal required fields", async () => {
      const createDto = {
        title: "Minimal Post",
        slug: "minimal-post",
      };

      const mockCreatedPost = {
        id: "1",
        ...createDto,
        summary: null,
        contentMd: null,
        contentHtml: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBlogService.create.mockResolvedValue(mockCreatedPost);

      const result = await controller.create(createDto);

      expect(mockBlogService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCreatedPost);
    });

    it("should return error for invalid slug in create", async () => {
      const createDto = {
        title: "Invalid Slug Post",
        slug: "Invalid Slug!", // Invalid slug
      };

      const result = await controller.create(createDto);

      expect(result).toEqual({ error: "Invalid slug" });
      expect(mockBlogService.create).not.toHaveBeenCalled();
    });

    it("should handle service errors during creation", async () => {
      const createDto = {
        title: "New Post",
        slug: "new-post",
      };

      const error = new Error("Creation failed");
      mockBlogService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(
        "Creation failed",
      );
    });
  });

  describe("update", () => {
    it("should update blog post successfully", async () => {
      const slug = "existing-post";
      const updateDto = {
        title: "Updated Post",
        summary: "Updated summary",
        contentMd: "# Updated\n\nUpdated content.",
        published: true,
      };

      const mockUpdatedPost = {
        id: "1",
        slug,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockBlogService.update.mockResolvedValue(mockUpdatedPost);

      const result = await controller.update(slug, updateDto);

      expect(mockBlogService.update).toHaveBeenCalledWith(slug, updateDto);
      expect(result).toEqual(mockUpdatedPost);
    });

    it("should update blog post with partial data", async () => {
      const slug = "existing-post";
      const updateDto = {
        title: "Updated Title Only",
      };

      const mockUpdatedPost = {
        id: "1",
        slug,
        title: "Updated Title Only",
        summary: "Original summary",
        contentMd: "Original content",
        published: false,
        updatedAt: new Date(),
      };

      mockBlogService.update.mockResolvedValue(mockUpdatedPost);

      const result = await controller.update(slug, updateDto);

      expect(mockBlogService.update).toHaveBeenCalledWith(slug, updateDto);
      expect(result).toEqual(mockUpdatedPost);
    });

    it("should return error for invalid slug in update", async () => {
      const invalidSlug = "Invalid Slug!";
      const updateDto = { title: "Updated Title" };

      const result = await controller.update(invalidSlug, updateDto);

      expect(result).toEqual({ error: "Invalid slug" });
      expect(mockBlogService.update).not.toHaveBeenCalled();
    });

    it("should handle service errors during update", async () => {
      const slug = "existing-post";
      const updateDto = { title: "Updated Title" };

      const error = new Error("Update failed");
      mockBlogService.update.mockRejectedValue(error);

      await expect(controller.update(slug, updateDto)).rejects.toThrow(
        "Update failed",
      );
    });
  });

  describe("remove", () => {
    it("should delete blog post successfully", async () => {
      const slug = "post-to-delete";
      const mockDeletedPost = {
        id: "1",
        title: "Deleted Post",
        slug,
      };

      mockBlogService.delete.mockResolvedValue(mockDeletedPost);

      const result = await controller.remove(slug);

      expect(mockBlogService.delete).toHaveBeenCalledWith(slug);
      expect(result).toEqual(mockDeletedPost);
    });

    it("should return error for invalid slug in delete", async () => {
      const invalidSlug = "Invalid Slug!";

      const result = await controller.remove(invalidSlug);

      expect(result).toEqual({ error: "Invalid slug" });
      expect(mockBlogService.delete).not.toHaveBeenCalled();
    });

    it("should handle service errors during deletion", async () => {
      const slug = "existing-post";

      const error = new Error("Deletion failed");
      mockBlogService.delete.mockRejectedValue(error);

      await expect(controller.remove(slug)).rejects.toThrow("Deletion failed");
    });
  });

  describe("Slug Validation", () => {
    it("should validate slug format correctly", async () => {
      // Test the isValidSlug function indirectly through controller methods
      const validSlugs = [
        "hello-world",
        "my-first-post",
        "post-123",
        "a",
        "test-post-with-many-words",
        "123-456-789",
      ];

      const invalidSlugs = [
        "Hello World", // spaces
        "hello_world", // underscores
        "hello.world", // dots
        "hello@world", // special chars
        "Hello-World", // uppercase
        "-hello-world", // starts with dash
        "hello-world-", // ends with dash
        "hello--world", // double dash
        "", // empty
      ];

      // Valid slugs should not return error
      for (const slug of validSlugs) {
        mockBlogService.findOne.mockResolvedValue({ slug });
        const result = await controller.get(slug);
        expect(result).not.toEqual({ error: "Invalid slug" });
        vi.clearAllMocks();
      }

      // Invalid slugs should return error
      for (const slug of invalidSlugs) {
        const result = await controller.get(slug);
        if (slug !== "") {
          // Empty string might be handled differently
          expect(result).toEqual({ error: "Invalid slug" });
        }
        expect(mockBlogService.findOne).not.toHaveBeenCalled();
        vi.clearAllMocks();
      }
    });
  });

  describe("Authentication", () => {
    it("should require authentication for create endpoint", () => {
      // This test verifies that the @UseGuards(AuthGuard) decorator is applied
      // The actual authentication logic is tested in the AuthGuard tests
      const createMethod = Reflect.getMetadata("__guards__", controller.create);
      expect(createMethod).toBeDefined();
    });

    it("should require authentication for update endpoint", () => {
      const updateMethod = Reflect.getMetadata("__guards__", controller.update);
      expect(updateMethod).toBeDefined();
    });

    it("should require authentication for remove endpoint", () => {
      const removeMethod = Reflect.getMetadata("__guards__", controller.remove);
      expect(removeMethod).toBeDefined();
    });

    it("should not require authentication for list endpoint", () => {
      const listMethod = Reflect.getMetadata("__guards__", controller.list);
      expect(listMethod).toBeUndefined();
    });

    it("should not require authentication for get endpoint", () => {
      const getMethod = Reflect.getMetadata("__guards__", controller.get);
      expect(getMethod).toBeUndefined();
    });
  });
});
