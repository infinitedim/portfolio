import { Test, TestingModule } from "@nestjs/testing";
import { LoggingService } from "../logging.service";
import { PortfolioLoggerService } from "@portfolio/logger";
import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
  afterEach,
  type Mocked,
} from "vitest";

describe("LoggingService", () => {
  let service: LoggingService;
  let mockLogger: Mocked<PortfolioLoggerService>;
  let mockSecurityLogger: Mocked<PortfolioLoggerService>;
  let mockPerformanceLogger: Mocked<PortfolioLoggerService>;

  beforeEach(async () => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      http: vi.fn(),
    } as any;

    mockSecurityLogger = {
      warn: vi.fn(),
    } as any;

    mockPerformanceLogger = {
      info: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingService,
        {
          provide: "LOGGER",
          useValue: mockLogger,
        },
        {
          provide: "SECURITY_LOGGER",
          useValue: mockSecurityLogger,
        },
        {
          provide: "PERFORMANCE_LOGGER",
          useValue: mockPerformanceLogger,
        },
      ],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("logInfo", () => {
    it("should log info message without metadata", () => {
      const message = "Test info message";
      service.logInfo(message);

      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });

    it("should log info message with metadata", () => {
      const message = "Test info message";
      const meta = { userId: "123", action: "test" };
      service.logInfo(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });
  });

  describe("logError", () => {
    it("should log error message without error object", () => {
      const message = "Test error message";
      service.logError(message);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        error: undefined,
        stack: undefined,
      });
    });

    it("should log error message with error object", () => {
      const message = "Test error message";
      const error = new Error("Test error");
      service.logError(message, error);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        error: "Test error",
        stack: error.stack,
      });
    });

    it("should log error message with error object and metadata", () => {
      const message = "Test error message";
      const error = new Error("Test error");
      const meta = { userId: "123", action: "test" };
      service.logError(message, error, meta);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        error: "Test error",
        stack: error.stack,
        userId: "123",
        action: "test",
      });
    });
  });

  describe("logWarn", () => {
    it("should log warning message without metadata", () => {
      const message = "Test warning message";
      service.logWarn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, undefined);
    });

    it("should log warning message with metadata", () => {
      const message = "Test warning message";
      const meta = { userId: "123", action: "test" };
      service.logWarn(message, meta);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
    });
  });

  describe("logDebug", () => {
    it("should log debug message without metadata", () => {
      const message = "Test debug message";
      service.logDebug(message);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, undefined);
    });

    it("should log debug message with metadata", () => {
      const message = "Test debug message";
      const meta = { userId: "123", action: "test" };
      service.logDebug(message, meta);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, meta);
    });
  });

  describe("logHttp", () => {
    it("should log HTTP request without metadata", () => {
      const method = "GET";
      const path = "/api/test";
      const statusCode = 200;
      const responseTime = 150;

      service.logHttp(method, path, statusCode, responseTime);

      expect(mockLogger.http).toHaveBeenCalledWith("HTTP Request", {
        method,
        path,
        statusCode,
        responseTime,
      });
    });

    it("should log HTTP request with metadata", () => {
      const method = "POST";
      const path = "/api/test";
      const statusCode = 201;
      const responseTime = 250;
      const meta = { userId: "123", ip: "192.168.1.1" };

      service.logHttp(method, path, statusCode, responseTime, meta);

      expect(mockLogger.http).toHaveBeenCalledWith("HTTP Request", {
        method,
        path,
        statusCode,
        responseTime,
        userId: "123",
        ip: "192.168.1.1",
      });
    });
  });

  describe("logSecurity", () => {
    it("should log security event", () => {
      const event = "LOGIN_ATTEMPT";
      const details = { userId: "123", ip: "192.168.1.1", success: false };

      service.logSecurity(event, details);

      expect(mockSecurityLogger.warn).toHaveBeenCalledWith(
        `SECURITY: ${event}`,
        {
          event: "SECURITY",
          userId: "123",
          ip: "192.168.1.1",
          success: false,
        },
      );
    });
  });

  describe("logPerformance", () => {
    it("should log performance metric without details", () => {
      const metric = "response_time";
      const value = 150;

      service.logPerformance(metric, value);

      expect(mockPerformanceLogger.info).toHaveBeenCalledWith(
        `Performance: ${metric}`,
        {
          metric,
          value,
        },
      );
    });

    it("should log performance metric with details", () => {
      const metric = "database_query";
      const value = 50;
      const details = { table: "users", operation: "SELECT" };

      service.logPerformance(metric, value, details);

      expect(mockPerformanceLogger.info).toHaveBeenCalledWith(
        `Performance: ${metric}`,
        {
          metric,
          value,
          table: "users",
          operation: "SELECT",
        },
      );
    });
  });
});
