import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppController } from "./app.controller";
import { DatabaseService } from "./shared/database/database.service";
import packageJSON from "./../../../package.json";

describe("AppController", () => {
  let appController: AppController;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const mockDatabaseService = {
      db: {
        execute: vi.fn().mockResolvedValue([{ test: 1 }]),
      },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    databaseService = app.get<DatabaseService>(DatabaseService);
  });

  describe("healthCheck", () => {
    it("should return health status with OK database", async () => {
      const result = await appController.healthCheck();

      expect(result).toHaveProperty("status", "OK");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("version", packageJSON.version);
      expect(result).toHaveProperty("service", "Mutafriches API");
      expect(result.checks).toHaveProperty("api", "OK");
      expect(result.checks).toHaveProperty("database", "OK");
    });

    it("should return DEGRADED status when database is disconnected", async () => {
      // Mock database as null
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (databaseService as any).db = null;

      const result = await appController.healthCheck();

      expect(result.status).toBe("DEGRADED");
      expect(result.checks.database).toBe("DISCONNECTED");
    });

    it("should return DEGRADED status when database throws error", async () => {
      // Mock database execute to throw
      vi.spyOn(databaseService.db, "execute").mockRejectedValue(new Error("DB Error"));

      const result = await appController.healthCheck();

      expect(result.status).toBe("DEGRADED");
      expect(result.checks.database).toBe("ERROR");
    });
  });
});
