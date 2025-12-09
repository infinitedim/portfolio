import { Test, TestingModule } from "@nestjs/testing";
import { AiService } from "../ai.service";
import { ConfigService } from "@nestjs/config";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { streamText } from "ai";

// Mock the ai module
vi.mock("ai", async () => {
  return {
    streamText: vi.fn(),
    anthropic: vi.fn(),
  };
});

describe("AiService", () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should call streamText with correct parameters", async () => {
    const mockToTextStreamResponse = vi.fn();
    (streamText as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      toTextStreamResponse: mockToTextStreamResponse,
    });

    const messages = [{ role: "user", content: "Hello" }];
    await service.streamChat(messages as any);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages,
        model: expect.anything(),
      }),
    );
    expect(mockToTextStreamResponse).toHaveBeenCalled();
  });

  it("should throw error if streamText fails", async () => {
    (streamText as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("AI Error");
      },
    );

    const messages = [{ role: "user", content: "Hello" }];
    await expect(service.streamChat(messages as any)).rejects.toThrow(
      "AI Error",
    );
  });
});
