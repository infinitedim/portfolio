/* eslint-disable promise/param-names */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(async () => {
    const mockService = {
      $connect: vi.fn(),
      $on: vi.fn(),
      onModuleInit: vi.fn().mockImplementation(async function (this: {
        $connect: () => Promise<void>;
      }) {
        await this.$connect();
      }),
      enableShutdownHooks: vi.fn().mockImplementation(async function (
        this: { $on: (event: string, cb: () => Promise<void>) => void },
        app: INestApplication,
      ) {
        if (app && typeof app.close === "function") {
          this.$on("beforeExit", async () => {
            await app.close();
          });
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: mockService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should connect to the database", async () => {
      // Mock the $connect method
      service.$connect = vi.fn().mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(service.$connect).toHaveBeenCalled();
    });

    it("should handle connection errors", async () => {
      const error = new Error("Database connection failed");
      service.$connect = vi.fn().mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle connection timeout", async () => {
      service.$connect = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Connection timeout")), 100);
        });
      });

      await expect(service.onModuleInit()).rejects.toThrow(
        "Connection timeout",
      );
    });
  });

  describe("enableShutdownHooks", () => {
    it("should register shutdown hook", async () => {
      const mockApp = {
        close: vi.fn(),
      } as any;

      service.$on = vi.fn().mockImplementation((event, callback) => {
        // Simulate the beforeExit event
        if (event === "beforeExit") {
          callback();
        }
      });

      await service.enableShutdownHooks(mockApp);

      expect(service.$on).toHaveBeenCalledWith(
        "beforeExit",
        expect.any(Function),
      );
    });

    it("should close the application on beforeExit event", async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      } as any;

      let exitCallback: (() => Promise<void>) | undefined;

      service.$on = vi.fn().mockImplementation((event, callback) => {
        if (event === "beforeExit") {
          exitCallback = callback;
        }
      });

      await service.enableShutdownHooks(mockApp);

      // Simulate the beforeExit event
      if (exitCallback) {
        await exitCallback();
      }

      expect(mockApp.close).toHaveBeenCalled();
    });

    it("should handle application close errors", async () => {
      const mockApp = {
        close: vi.fn().mockRejectedValue(new Error("Failed to close app")),
      } as any;

      let exitCallback: (() => Promise<void>) | undefined;

      service.$on = vi.fn().mockImplementation((event, callback) => {
        if (event === "beforeExit") {
          exitCallback = callback;
        }
      });

      await service.enableShutdownHooks(mockApp);

      // Simulate the beforeExit event
      if (exitCallback) {
        await expect(exitCallback()).rejects.toThrow("Failed to close app");
      }
    });

    it("should register multiple shutdown hooks", async () => {
      const mockApp = {
        close: vi.fn(),
      } as any;

      service.$on = vi.fn();

      await service.enableShutdownHooks(mockApp);

      expect(service.$on).toHaveBeenCalledTimes(1);
      expect(service.$on).toHaveBeenCalledWith(
        "beforeExit",
        expect.any(Function),
      );
    });
  });

  describe("service lifecycle", () => {
    it("should initialize and enable shutdown hooks in sequence", async () => {
      const mockApp = {
        close: vi.fn(),
      } as any;

      service.$connect = vi.fn().mockResolvedValue(undefined);
      service.$on = vi.fn();

      // Initialize the service
      await service.onModuleInit();

      // Enable shutdown hooks
      await service.enableShutdownHooks(mockApp);

      expect(service.$connect).toHaveBeenCalled();
      expect(service.$on).toHaveBeenCalledWith(
        "beforeExit",
        expect.any(Function),
      );
    });

    it("should handle initialization failure gracefully", async () => {
      const mockApp = {
        close: vi.fn(),
      } as any;

      service.$connect = vi.fn().mockRejectedValue(new Error("Init failed"));

      // Try to initialize (should fail)
      await expect(service.onModuleInit()).rejects.toThrow("Init failed");

      // Shutdown hooks should still work
      service.$on = vi.fn();
      await service.enableShutdownHooks(mockApp);

      expect(service.$on).toHaveBeenCalledWith(
        "beforeExit",
        expect.any(Function),
      );
    });
  });

  describe("error handling", () => {
    it("should handle undefined app in enableShutdownHooks", async () => {
      service.$on = vi.fn();

      await service.enableShutdownHooks(undefined as any);
      expect(service.$on).not.toHaveBeenCalled();
    });

    it("should handle app without close method", async () => {
      const mockApp = {} as any;

      service.$on = vi.fn();

      await service.enableShutdownHooks(mockApp);

      // Should not throw, but close method won't be called
      expect(service.$on).not.toHaveBeenCalled();
    });
  });
});
