import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { log, Logger, logger, logSecurity, logPerformance, logAPICall } from "../logger";

describe("log", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("logs a message with the correct structure", () => {
    // Clear buffer first
    logger.clearLogBuffer();

    log("info", "Hello world");

    // Check that the message was added to the buffer
    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("Hello world");
    expect(buffer[0]!.level).toBe("info");
  });

  it("masks sensitive fields in meta", () => {
    logger.clearLogBuffer();

    const sensitiveData = {
      password: "supersecret",
      token: "abcdef123456",
      username: "user1",
      client_secret: "shhh",
      authorization: "Bearer xyz",
      normal: "visible",
    };

    log("error", "Sensitive data", sensitiveData);

    // Check that the message was logged with masked data
    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("Sensitive data");
    expect(buffer[0]!.level).toBe("error");

    // Check that sensitive data is masked
    const loggedData = buffer[0] as Record<string, unknown>;
    expect(loggedData.password).toMatch(/^\w{2}\*\*\*.*\w{2}$/);
    expect(loggedData.token).toMatch(/^\w{2}\*\*\*.*\w{2}$/);
    expect(loggedData.username).toBe("user1");
    expect(loggedData.client_secret).toBe("***");
    expect(loggedData.authorization).toMatch(/^\w{2}\*\*\*.*\w{2}$/);
    expect(loggedData.normal).toBe("visible");
  });

  it("handles meta with no sensitive fields", () => {
    logger.clearLogBuffer();

    const normalData = { foo: "bar", count: 42 };
    log("info", "No sensitive", normalData);

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("No sensitive");
    expect(buffer[0]!.level).toBe("info");

    const loggedData = buffer[0] as Record<string, unknown>;
    expect(loggedData.foo).toBe("bar");
    expect(loggedData.count).toBe(42);
  });

  it("handles undefined meta", () => {
    logger.clearLogBuffer();

    log("warn", "No meta");

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("No meta");
    expect(buffer[0]!.level).toBe("warn");
  });
});

describe("Logger class", () => {
  let testLogger: Logger;

  beforeEach(() => {
    testLogger = new Logger({ level: "debug" });
  });

  it("creates logger with correct configuration", () => {
    const config = testLogger.getConfig();
    expect(config.level).toBe("debug");
    expect(config.enableConsole).toBe(true);
    expect(config.maskSensitiveData).toBe(true);
  });

  it("logs messages at appropriate levels", () => {
    testLogger.clearLogBuffer();

    testLogger.error("Error message");
    testLogger.warn("Warning message");
    testLogger.info("Info message");

    const buffer = testLogger.getLogBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer[0]!.message).toBe("Error message");
    expect(buffer[0]!.level).toBe("error");
    expect(buffer[1]!.message).toBe("Warning message");
    expect(buffer[1]!.level).toBe("warn");
    expect(buffer[2]!.message).toBe("Info message");
    expect(buffer[2]!.level).toBe("info");
  });

  it("respects log level configuration", () => {
    const warnLogger = new Logger({ level: "warn" });
    warnLogger.clearLogBuffer();

    // Check that the Winston logger level is set correctly
    expect(warnLogger.getWinstonLogger().level).toBe("warn");

    // Test that the logger configuration is correct
    const config = warnLogger.getConfig();
    expect(config.level).toBe("warn");
  });

  it("maintains log buffer", () => {
    testLogger.clearLogBuffer();
    testLogger.info("Test message");
    const buffer = testLogger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("Test message");
  });

  it("clears log buffer", () => {
    testLogger.clearLogBuffer();
    testLogger.info("Test message");
    expect(testLogger.getLogBuffer()).toHaveLength(1);

    testLogger.clearLogBuffer();
    expect(testLogger.getLogBuffer()).toHaveLength(0);
  });

  it("exports logs as JSON", () => {
    testLogger.clearLogBuffer();
    testLogger.info("Test message");
    const exported = testLogger.exportLogs();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].message).toBe("Test message");
  });

  it("provides Winston-specific methods", () => {
    const winstonLogger = testLogger.getWinstonLogger();
    expect(winstonLogger).toBeDefined();
    expect(typeof winstonLogger.log).toBe("function");
  });

  it("supports profiling", () => {
    expect(() => {
      testLogger.profile("test-operation");
    }).not.toThrow();
  });

  it("supports timers", () => {
    const timer = testLogger.startTimer();
    expect(typeof timer.done).toBe("function");
  });
});

describe("Utility functions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    logger.clearLogBuffer();
  });

  it("logSecurity logs security events", () => {
    logSecurity("Login attempt", { userId: "123", ip: "192.168.1.1" });

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("SECURITY: Login attempt");
    expect(buffer[0]!.level).toBe("warn");

    const loggedData = buffer[0] as Record<string, unknown>;
    expect(loggedData.event).toBe("SECURITY");
    expect(loggedData.userId).toBe("123");
    expect(loggedData.ip).toBe("192.168.1.1");
  });

  it("logPerformance logs performance metrics", () => {
    logPerformance("Response time", 150, { endpoint: "/api/users" });

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("PERFORMANCE: Response time");
    expect(buffer[0]!.level).toBe("info");

    const loggedData = buffer[0] as Record<string, unknown>;
    expect(loggedData.metric).toBe("Response time");
    expect(loggedData.value).toBe(150);
    expect(loggedData.endpoint).toBe("/api/users");
  });

  it("logAPICall logs API calls", () => {
    logAPICall("GET", "/api/users", 200, 150, "user123");

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("API Call");
    expect(buffer[0]!.level).toBe("http");

    const loggedData = buffer[0] as Record<string, unknown>;
    expect(loggedData.method).toBe("GET");
    expect(loggedData.path).toBe("/api/users");
    expect(loggedData.statusCode).toBe(200);
    expect(loggedData.responseTime).toBe(150);
    expect(loggedData.userId).toBe("user123");
  });
});

describe("Default logger instance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("provides default logger functionality", () => {
    logger.clearLogBuffer();
    logger.info("Test message");

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0]!.message).toBe("Test message");
    expect(buffer[0]!.level).toBe("info");
  });

  it("maintains buffer across calls", () => {
    logger.clearLogBuffer(); // Clear buffer from previous tests
    logger.info("Message 1");
    logger.info("Message 2");

    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0]!.message).toBe("Message 1");
    expect(buffer[1]!.message).toBe("Message 2");
  });
});
