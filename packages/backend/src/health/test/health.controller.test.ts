import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { HealthController } from "../../health/health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
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

  it("should return ping response", () => {
    const result = controller.ping();
    expect(result).toEqual({ message: "pong" });
  });
});
