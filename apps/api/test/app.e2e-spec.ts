import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppController } from "../src/app.controller";
import { DatabaseService } from "../src/shared/database/database.service";
import { HealthResponse } from "../src/shared/types/common.types";

describe("AppController (Integration)", () => {
  let appController: AppController;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock du DatabaseService
    const mockDatabaseService = {
      db: {
        execute: vi.fn().mockResolvedValue([{ test: 1 }]),
      },
      onModuleInit: vi.fn(),
      onModuleDestroy: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    appController = moduleFixture.get<AppController>(AppController);
  });

  it("should return health status", async () => {
    const result: HealthResponse = await appController.healthCheck();

    expect(result).toHaveProperty("status", "OK");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("service", "Mutafriches API");
    expect(result.checks).toHaveProperty("api", "OK");
    expect(result.checks).toHaveProperty("database", "OK");
  });
});
