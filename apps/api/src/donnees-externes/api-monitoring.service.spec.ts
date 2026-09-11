import { describe, it, expect, vi, beforeEach } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import type { AxiosResponse } from "axios";
import type {
  ApiHealthItem,
  ApiHealthStatus,
  ApiMonitoringSnapshot,
} from "@mutafriches/shared-types";
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
    /** Mesure stockée pour une entrée réelle du registre */
    const mesureStockee = (key: string, status: ApiHealthStatus = "up"): ApiHealthItem => ({
      key,
      name: "Libellé périmé",
      category: "Catégorie périmée",
      description: "Description périmée",
      docUrl: "https://exemple.invalid",
      adapterFile: "ancien/chemin.ts",
      baseUrl: "https://exemple.invalid",
      healthCheckUrl: "https://exemple.invalid/ping",
      status,
      httpStatus: 200,
      responseTimeMs: 120,
      error: null,
    });

    it("liste tout le registre en 'non-teste' si aucune ligne en base", async () => {
      dbExecute.mockResolvedValueOnce([]);

      const result = await service.getLatestSnapshot();

      expect(result.checkedAt).toBeNull();
      expect(result.apis).toHaveLength(API_MONITORING_ENTRIES.length);
      expect(result.apis.every((a) => a.status === "non-teste")).toBe(true);
      expect(result.summary).toEqual({
        up: 0,
        slow: 0,
        down: 0,
        nonTeste: API_MONITORING_ENTRIES.length,
      });
    });

    it("reprend la mesure stockée pour les entrées déjà vérifiées", async () => {
      const premiere = API_MONITORING_ENTRIES[0];
      const stored: ApiMonitoringSnapshot = {
        checkedAt: "2026-05-22T05:00:00.000Z",
        apis: [mesureStockee(premiere.key, "slow")],
        summary: { up: 0, slow: 1, down: 0, nonTeste: 0 },
      };
      dbExecute.mockResolvedValueOnce([{ data: stored, checked_at: new Date() }]);

      const result = await service.getLatestSnapshot();
      const mesuree = result.apis.find((a) => a.key === premiere.key);

      expect(result.checkedAt).toBe("2026-05-22T05:00:00.000Z");
      expect(mesuree?.status).toBe("slow");
      expect(mesuree?.responseTimeMs).toBe(120);
      expect(result.summary.slow).toBe(1);
      expect(result.summary.nonTeste).toBe(API_MONITORING_ENTRIES.length - 1);
    });

    // Le registre fait foi : un libellé ou une catégorie corrigés ne doivent pas attendre
    // le prochain cycle pour apparaître.
    it("prend les métadonnées dans le registre, pas dans le snapshot", async () => {
      const premiere = API_MONITORING_ENTRIES[0];
      const stored: ApiMonitoringSnapshot = {
        checkedAt: "2026-05-22T05:00:00.000Z",
        apis: [mesureStockee(premiere.key)],
        summary: { up: 1, slow: 0, down: 0, nonTeste: 0 },
      };
      dbExecute.mockResolvedValueOnce([{ data: stored, checked_at: new Date() }]);

      const result = await service.getLatestSnapshot();
      const mesuree = result.apis.find((a) => a.key === premiere.key);

      expect(mesuree?.name).toBe(premiere.name);
      expect(mesuree?.category).toBe(premiere.category);
      expect(mesuree?.adapterFile).toBe(premiere.adapterFile);
    });

    it("écarte une entrée présente au snapshot mais retirée du registre", async () => {
      const stored: ApiMonitoringSnapshot = {
        checkedAt: "2026-05-22T05:00:00.000Z",
        apis: [mesureStockee("source-retiree-du-registre")],
        summary: { up: 1, slow: 0, down: 0, nonTeste: 0 },
      };
      dbExecute.mockResolvedValueOnce([{ data: stored, checked_at: new Date() }]);

      const result = await service.getLatestSnapshot();

      expect(result.apis.map((a) => a.key)).not.toContain("source-retiree-du-registre");
      expect(result.apis).toHaveLength(API_MONITORING_ENTRIES.length);
    });

    it("liste le registre en 'non-teste' en cas d'erreur DB", async () => {
      dbExecute.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await service.getLatestSnapshot();

      expect(result.checkedAt).toBeNull();
      expect(result.apis.every((a) => a.status === "non-teste")).toBe(true);
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
