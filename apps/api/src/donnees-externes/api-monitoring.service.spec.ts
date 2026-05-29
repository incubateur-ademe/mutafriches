import { describe, it, expect, vi, beforeEach } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import type { AxiosResponse } from "axios";
import type { ApiMonitoringSnapshot } from "@mutafriches/shared-types";
import { ApiMonitoringService } from "./api-monitoring.service";
import { DatabaseService } from "../shared/database/database.service";
import { API_MONITORING_ENTRIES } from "./api-monitoring.config";

function createMockDatabaseService() {
  return {
    db: {
      execute: vi.fn(),
    },
  } as unknown as DatabaseService;
}

function createMockHttpService() {
  return {
    get: vi.fn(),
    post: vi.fn(),
  } as unknown as HttpService;
}

function axiosOk(elapsedMs = 100): AxiosResponse {
  return {
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as never,
  } as AxiosResponse;
}

function axiosError(status: number): AxiosResponse {
  return {
    data: {},
    status,
    statusText: "ERR",
    headers: {},
    config: {} as never,
  } as AxiosResponse;
}

describe("ApiMonitoringService", () => {
  let service: ApiMonitoringService;
  let httpService: HttpService;
  let databaseService: DatabaseService;
  let dbExecute: ReturnType<typeof vi.fn>;
  let httpGet: ReturnType<typeof vi.fn>;
  let httpPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpService = createMockHttpService();
    databaseService = createMockDatabaseService();
    dbExecute = databaseService.db.execute as ReturnType<typeof vi.fn>;
    httpGet = httpService.get as ReturnType<typeof vi.fn>;
    httpPost = httpService.post as ReturnType<typeof vi.fn>;
    service = new ApiMonitoringService(httpService, databaseService);
    // Par défaut, db.execute renvoie un succès vide
    dbExecute.mockResolvedValue([]);
  });

  describe("getLatestSnapshot", () => {
    it("retourne un snapshot vide si aucune ligne en base", async () => {
      dbExecute.mockResolvedValueOnce([]);

      const result = await service.getLatestSnapshot();

      expect(result.checkedAt).toBeNull();
      expect(result.apis).toEqual([]);
      expect(result.summary).toEqual({ up: 0, slow: 0, down: 0 });
    });

    it("retourne le snapshot stocké si une ligne existe", async () => {
      const stored: ApiMonitoringSnapshot = {
        checkedAt: "2026-05-22T05:00:00.000Z",
        apis: [],
        summary: { up: 10, slow: 1, down: 2 },
      };
      dbExecute.mockResolvedValueOnce([{ data: stored, checked_at: new Date() }]);

      const result = await service.getLatestSnapshot();

      expect(result).toEqual(stored);
    });

    it("retourne un snapshot vide en cas d'erreur DB", async () => {
      dbExecute.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await service.getLatestSnapshot();

      expect(result.checkedAt).toBeNull();
      expect(result.apis).toEqual([]);
    });
  });

  describe("runHealthCheck", () => {
    it("classe une réponse 200 rapide comme 'up'", async () => {
      httpGet.mockReturnValue(of(axiosOk()));
      httpPost.mockReturnValue(of(axiosOk()));

      const result = await service.runHealthCheck();

      // Au moins une entrée doit être up (toutes répondent 200 instantanément avec le mock)
      expect(result.summary.up).toBeGreaterThan(0);
      expect(result.summary.down).toBe(0);
      expect(result.apis.every((a) => a.status === "up")).toBe(true);
    });

    it("classe une réponse 5xx comme 'down'", async () => {
      httpGet.mockReturnValue(of(axiosError(503)));
      httpPost.mockReturnValue(of(axiosError(503)));

      const result = await service.runHealthCheck();

      expect(result.summary.down).toBe(API_MONITORING_ENTRIES.length);
      expect(result.summary.up).toBe(0);
      expect(result.apis.every((a) => a.status === "down")).toBe(true);
      expect(result.apis[0].error).toContain("HTTP 503");
    });

    it("classe une réponse 4xx comme 'up' (serveur répond)", async () => {
      // 400 = bad request : le serveur tourne mais nos params sont invalides
      httpGet.mockReturnValue(of(axiosError(400)));
      httpPost.mockReturnValue(of(axiosError(400)));

      const result = await service.runHealthCheck();

      expect(result.summary.up).toBe(API_MONITORING_ENTRIES.length);
      expect(result.summary.down).toBe(0);
      expect(result.apis[0].httpStatus).toBe(400);
    });

    it("classe un timeout / erreur réseau comme 'down'", async () => {
      httpGet.mockReturnValue(throwError(() => new Error("timeout of 5000ms exceeded")));
      httpPost.mockReturnValue(throwError(() => new Error("timeout of 5000ms exceeded")));

      const result = await service.runHealthCheck();

      expect(result.summary.down).toBe(API_MONITORING_ENTRIES.length);
      expect(result.apis[0].httpStatus).toBeNull();
      expect(result.apis[0].error).toContain("Délai d'attente");
    });

    it("appelle bien GET ou POST selon la méthode configurée", async () => {
      httpGet.mockReturnValue(of(axiosOk()));
      httpPost.mockReturnValue(of(axiosOk()));

      await service.runHealthCheck();

      const postEntries = API_MONITORING_ENTRIES.filter((e) => e.healthCheckMethod === "POST");
      const getEntries = API_MONITORING_ENTRIES.filter((e) => e.healthCheckMethod === "GET");
      expect(httpPost).toHaveBeenCalledTimes(postEntries.length);
      expect(httpGet).toHaveBeenCalledTimes(getEntries.length);
    });

    it("persiste un nouveau snapshot et déclenche un cleanup", async () => {
      httpGet.mockReturnValue(of(axiosOk()));
      httpPost.mockReturnValue(of(axiosOk()));

      await service.runHealthCheck();

      // db.execute appelé pour INSERT + DELETE des vieux snapshots
      const insertCalls = dbExecute.mock.calls.filter((call) => {
        const sqlText = JSON.stringify(call[0]);
        return sqlText.includes("INSERT INTO api_health_snapshots");
      });
      const deleteCalls = dbExecute.mock.calls.filter((call) => {
        const sqlText = JSON.stringify(call[0]);
        return sqlText.includes("DELETE FROM api_health_snapshots");
      });
      expect(insertCalls).toHaveLength(1);
      expect(deleteCalls).toHaveLength(1);
    });

    it("a un summary cohérent avec les apis (mix up + down)", async () => {
      let callCount = 0;
      httpGet.mockImplementation(() => {
        callCount++;
        return callCount % 2 === 0 ? of(axiosError(503)) : of(axiosOk());
      });
      httpPost.mockReturnValue(of(axiosOk()));

      const result = await service.runHealthCheck();

      const totalFromSummary = result.summary.up + result.summary.slow + result.summary.down;
      expect(totalFromSummary).toBe(result.apis.length);
      expect(result.apis.length).toBe(API_MONITORING_ENTRIES.length);
    });

    it("inclut le checkedAt au format ISO", async () => {
      httpGet.mockReturnValue(of(axiosOk()));
      httpPost.mockReturnValue(of(axiosOk()));

      const result = await service.runHealthCheck();

      expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
