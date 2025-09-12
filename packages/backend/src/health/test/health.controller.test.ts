import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { HealthController } from "../../health/health.controller";
import { HealthService } from "../../health/health.service";

// Minimal mock for HealthService used in controller tests
const mockHealthService: Partial<HealthService> = {
  ping: () => ({ message: "pong" }) as any,
  checkHealth: async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: {
          status: "healthy",
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
        redis: {
          status: "healthy",
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
        memory: {
          status: "healthy",
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
        disk: {
          status: "healthy",
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
        system: {
          status: "healthy",
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
      },
      summary: { total: 5, healthy: 5, unhealthy: 0, degraded: 0 },
    } as any;
  },
};

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should return health status", () => {
    const result = controller.check();
    expect(result).toEqual({
      status: "ok",
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    });
  });

  it("should return ping response", async () => {
    const result = await controller.ping();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("message", "pong");
    if ((result as any).timestamp) {
      expect(typeof (result as any).timestamp).toBe("string");
    }
  });
});
