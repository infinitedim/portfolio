/* eslint-disable promise/valid-params */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpException, HttpStatus, type ArgumentsHost } from "@nestjs/common";

// Mock security/audit-log.service before other imports
vi.mock("../../security/audit-log.service", () => ({
  AuditLogService: vi.fn(),
  AuditEventType: {
    ERROR_OCCURRED: "ERROR_OCCURRED",
  },
}));

// Mock error-handler to avoid its dependencies
vi.mock("../error-handler", () => ({
  GlobalErrorHandler: vi.fn(),
  ErrorCategory: {
    VALIDATION: "VALIDATION",
    AUTHENTICATION: "AUTHENTICATION",
    AUTHORIZATION: "AUTHORIZATION",
    NOT_FOUND: "NOT_FOUND",
    RATE_LIMIT: "RATE_LIMIT",
    INTERNAL: "INTERNAL",
    EXTERNAL_SERVICE: "EXTERNAL_SERVICE",
    DATABASE: "DATABASE",
    SECURITY: "SECURITY",
  },
}));

import { GlobalExceptionFilter } from "../global-exception.filter";
import type { GlobalErrorHandler } from "../error-handler";

interface MockResponse {
  statusCode: number;
  jsonData: unknown;
  headers: Record<string, string>;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
}

interface MockRequest {
  headers: Record<string, string>;
  url: string;
  method: string;
  ip: string;
}

// Create mock error handler
const createMockErrorHandler = (): GlobalErrorHandler =>
  ({
    handleError: vi.fn().mockResolvedValue({
      error: {
        code: "ERR-500",
        message: "Internal server error",
        timestamp: new Date().toISOString(),
        requestId: "generated-id",
      },
      meta: {
        category: "INTERNAL",
        severity: "HIGH",
        retryable: false,
      },
    }),
  }) as unknown as GlobalErrorHandler;

// Create mock Express request/response with setHeader
const createMockArgumentsHost = (requestId?: string) => {
  const mockResponse: MockResponse = {
    statusCode: 200,
    jsonData: null,
    headers: {},
    status: vi.fn().mockImplementation(function (
      this: MockResponse,
      code: number,
    ) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function (
      this: MockResponse,
      data: unknown,
    ) {
      this.jsonData = data;
      return this;
    }),
    setHeader: vi.fn().mockImplementation(function (
      this: MockResponse,
      key: string,
      value: string,
    ) {
      this.headers[key] = value;
      return this;
    }),
  };

  const mockRequest: MockRequest = {
    headers: requestId ? { "x-request-id": requestId } : {},
    url: "/test-endpoint",
    method: "GET",
    ip: "127.0.0.1",
  };

  const host = {
    switchToHttp: vi.fn(() => ({
      getRequest: vi.fn(() => mockRequest),
      getResponse: vi.fn(() => mockResponse),
    })),
    getArgs: vi.fn(() => [mockRequest, mockResponse]),
    getArgByIndex: vi.fn(),
    switchToRpc: vi.fn(),
    switchToWs: vi.fn(),
    getType: vi.fn(() => "http"),
  } as unknown as ArgumentsHost;

  return { host, mockResponse, mockRequest };
};

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;
  let errorHandler: GlobalErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = createMockErrorHandler();
    filter = new GlobalExceptionFilter(errorHandler);
  });

  describe("catch", () => {
    it("should handle HttpException and return correct status", async () => {
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it("should handle generic Error and return 500", async () => {
      const exception = new Error("Something went wrong");
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it("should generate request ID when not provided", async () => {
      const exception = new Error("Test error");
      const { host } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it("should return structured error response", async () => {
      const exception = new HttpException(
        "Bad Request",
        HttpStatus.BAD_REQUEST,
      );
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      const response = mockResponse.jsonData as Record<string, unknown>;
      expect(response).toHaveProperty("error");
    });

    it("should handle HttpException with object response", async () => {
      const exception = new HttpException(
        { message: "Validation failed", errors: ["Field required"] },
        HttpStatus.BAD_REQUEST,
      );
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should handle unknown exception types", async () => {
      const exception = { custom: "error" };
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception as unknown as Error, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it("should handle null exception", async () => {
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(null as unknown as Error, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe("response structure", () => {
    it("should include error object in response", async () => {
      const exception = new Error("Test");
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      const response = mockResponse.jsonData as Record<string, unknown>;
      expect(response).toHaveProperty("error");
      const error = response.error as Record<string, unknown>;
      expect(error).toHaveProperty("timestamp");
      expect(error).toHaveProperty("requestId");
    });

    it("should set response headers", async () => {
      const exception = new Error("Test");
      const { host, mockResponse } = createMockArgumentsHost("req-123");

      await filter.catch(exception, host);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-Request-ID",
        expect.any(String),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json",
      );
    });
  });

  describe("error delegation", () => {
    it("should delegate error handling to GlobalErrorHandler", async () => {
      const exception = new Error("Test");
      const { host } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it("should pass request to error handler", async () => {
      const exception = new Error("Test");
      const { host } = createMockArgumentsHost("req-456");

      await filter.catch(exception, host);

      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          url: "/test-endpoint",
          method: "GET",
        }),
      );
    });
  });

  describe("status codes", () => {
    it("should return 400 for BAD_REQUEST", async () => {
      const exception = new HttpException(
        "Bad Request",
        HttpStatus.BAD_REQUEST,
      );
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 for UNAUTHORIZED", async () => {
      const exception = new HttpException(
        "Unauthorized",
        HttpStatus.UNAUTHORIZED,
      );
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 for FORBIDDEN", async () => {
      const exception = new HttpException("Forbidden", HttpStatus.FORBIDDEN);
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it("should return 404 for NOT_FOUND", async () => {
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it("should return 429 for TOO_MANY_REQUESTS", async () => {
      const exception = new HttpException(
        "Too Many Requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });

    it("should return 500 for INTERNAL_SERVER_ERROR", async () => {
      const exception = new HttpException(
        "Internal Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      const { host, mockResponse } = createMockArgumentsHost();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
