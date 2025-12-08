import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiResponse, ResponseHelper } from "../api-response";
import type { Response } from "express";

// Mock Response object
const createMockResponse = (): Partial<Response> & {
  statusCode: number;
  jsonData: unknown;
  headers: Map<string, string>;
} => {
  const res: Partial<Response> & {
    statusCode: number;
    jsonData: unknown;
    headers: Map<string, string>;
  } = {
    statusCode: 200,
    jsonData: null,
    headers: new Map(),
    locals: {},
    status: vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((data: unknown) => {
      res.jsonData = data;
      return res;
    }),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockImplementation((key: string, value: string) => {
      res.headers.set(key, value);
      return res;
    }),
  };
  return res;
};

describe("ApiResponse", () => {
  describe("constructor", () => {
    it("should create an ApiResponse instance with success", () => {
      const response = new ApiResponse(true, { id: 1 }, "Success");

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: 1 });
      expect(response.message).toBe("Success");
    });

    it("should create an ApiResponse instance with errors", () => {
      const response = new ApiResponse(false, null, "Error", [
        "Field required",
      ]);

      expect(response.success).toBe(false);
      expect(response.errors).toEqual(["Field required"]);
    });
  });

  describe("success", () => {
    it("should create a successful response with data", () => {
      const data = { id: 1, name: "Test" };
      const result = ApiResponse.success(data);

      expect(result.data).toEqual(data);
      expect(result.meta).toBeDefined();
      expect(result.meta?.timestamp).toBeDefined();
    });

    it("should include message when provided", () => {
      const result = ApiResponse.success({ id: 1 }, "Operation successful");

      expect(result.message).toBe("Operation successful");
    });

    it("should merge meta data when provided", () => {
      const result = ApiResponse.success({ id: 1 }, undefined, {
        version: "1.0.0",
        requestId: "req-123",
      });

      expect(result.meta?.version).toBe("1.0.0");
      expect(result.meta?.requestId).toBe("req-123");
    });
  });

  describe("error", () => {
    it("should create an error response with message and code", () => {
      const result = ApiResponse.error("Something went wrong", "ERR_001");

      expect(result.error.message).toBe("Something went wrong");
      expect(result.error.code).toBe("ERR_001");
      expect(result.error.timestamp).toBeDefined();
    });

    it("should use default code when not provided", () => {
      const result = ApiResponse.error("Error occurred");

      expect(result.error.code).toBe("ERROR");
    });

    it("should include details when provided", () => {
      const result = ApiResponse.error("Validation failed", "VAL_001", {
        field: "email",
        reason: "Invalid format",
      });

      expect(result.error.details).toEqual({
        field: "email",
        reason: "Invalid format",
      });
    });

    it("should include meta information", () => {
      const result = ApiResponse.error(
        "Error",
        "ERR",
        undefined,
        "VALIDATION",
        "HIGH",
        true,
      );

      expect(result.meta?.category).toBe("VALIDATION");
      expect(result.meta?.severity).toBe("HIGH");
      expect(result.meta?.retryable).toBe(true);
    });
  });

  describe("paginated", () => {
    it("should create a paginated response", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = ApiResponse.paginated(data, 1, 10, 100);

      expect(result.data).toEqual(data);
      expect(result.meta?.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      });
    });

    it("should calculate total pages correctly", () => {
      const result = ApiResponse.paginated([], 1, 10, 25);

      expect(result.meta?.pagination?.totalPages).toBe(3);
    });

    it("should include message when provided", () => {
      const result = ApiResponse.paginated([], 1, 10, 0, "No items found");

      expect(result.message).toBe("No items found");
    });
  });

  describe("list", () => {
    it("should create a list response", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = ApiResponse.list(data);

      expect(result.data).toEqual(data);
      expect(result.meta?.timestamp).toBeDefined();
    });

    it("should include message when provided", () => {
      const result = ApiResponse.list([], "Empty list");

      expect(result.message).toBe("Empty list");
    });
  });

  describe("message", () => {
    it("should create a message-only response", () => {
      const result = ApiResponse.message("Operation completed");

      expect(result.data).toBeNull();
      expect(result.message).toBe("Operation completed");
      expect(result.meta?.timestamp).toBeDefined();
    });
  });
});

describe("ResponseHelper", () => {
  let mockRes: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe("success", () => {
    it("should send success response with default status 200", () => {
      ResponseHelper.success(mockRes as Response, { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should send success response with custom status", () => {
      ResponseHelper.success(mockRes as Response, { id: 1 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should include request ID from locals", () => {
      mockRes.locals = { requestId: "req-123" };
      ResponseHelper.success(mockRes as Response, { id: 1 });

      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.meta.requestId).toBe("req-123");
    });
  });

  describe("error", () => {
    it("should send error response with default status 400", () => {
      ResponseHelper.error(mockRes as Response, "Error occurred");

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should send error response with custom status and code", () => {
      ResponseHelper.error(mockRes as Response, "Not found", 404, "NOT_FOUND");

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should include request ID from locals", () => {
      mockRes.locals = { requestId: "req-456" };
      ResponseHelper.error(mockRes as Response, "Error");

      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.requestId).toBe("req-456");
    });
  });

  describe("paginated", () => {
    it("should send paginated response", () => {
      ResponseHelper.paginated(
        mockRes as Response,
        [{ id: 1 }],
        1,
        10,
        100,
        200,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.meta.pagination).toBeDefined();
    });
  });

  describe("list", () => {
    it("should send list response", () => {
      ResponseHelper.list(mockRes as Response, [{ id: 1 }, { id: 2 }]);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("message", () => {
    it("should send message response", () => {
      ResponseHelper.message(mockRes as Response, "Success");

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("created", () => {
    it("should send created response with status 201", () => {
      ResponseHelper.created(mockRes as Response, { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("noContent", () => {
    it("should send no content response with status 204", () => {
      ResponseHelper.noContent(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe("unauthorized", () => {
    it("should send unauthorized response with status 401", () => {
      ResponseHelper.unauthorized(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.code).toBe("UNAUTHORIZED");
    });

    it("should use custom message when provided", () => {
      ResponseHelper.unauthorized(mockRes as Response, "Token expired");

      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.message).toBe("Token expired");
    });
  });

  describe("forbidden", () => {
    it("should send forbidden response with status 403", () => {
      ResponseHelper.forbidden(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.code).toBe("FORBIDDEN");
    });
  });

  describe("notFound", () => {
    it("should send not found response with status 404", () => {
      ResponseHelper.notFound(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.code).toBe("NOT_FOUND");
    });
  });

  describe("validationError", () => {
    it("should send validation error response with status 422", () => {
      ResponseHelper.validationError(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("rateLimit", () => {
    it("should send rate limit response with status 429", () => {
      ResponseHelper.rateLimit(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.code).toBe("RATE_LIMIT");
      expect(jsonArg.meta.retryable).toBe(true);
    });

    it("should set Retry-After header when provided", () => {
      ResponseHelper.rateLimit(mockRes as Response, "Too many requests", 60);

      expect(mockRes.setHeader).toHaveBeenCalledWith("Retry-After", "60");
    });
  });

  describe("internalError", () => {
    it("should send internal error response with status 500", () => {
      ResponseHelper.internalError(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const jsonArg = (mockRes.json as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0];
      expect(jsonArg.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
