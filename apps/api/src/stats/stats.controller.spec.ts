import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import type { StatOutput } from "@mutafriches/shared-types";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";
import { createTestingModuleWithService } from "../shared/__test-helpers__/test-module.factory";

function createMockStatsService() {
  return {
    getAllStats: vi.fn().mockResolvedValue([]),
  };
}

function createMockRequest(origin?: string): Request {
  return {
    headers: {
      origin: origin ?? undefined,
    },
  } as unknown as Request;
}

function createMockResponse(): Response & { _status: number; _headers: Record<string, string>; _body: unknown } {
  const res = {
    _status: 0,
    _headers: {} as Record<string, string>,
    _body: null as unknown,
    setHeader: vi.fn((name: string, value: string) => {
      res._headers[name] = value;
      return res;
    }),
    status: vi.fn((code: number) => {
      res._status = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      res._body = body;
      return res;
    }),
  };
  return res as unknown as Response & { _status: number; _headers: Record<string, string>; _body: unknown };
}

describe("StatsController", () => {
  let controller: StatsController;
  let statsService: ReturnType<typeof createMockStatsService>;

  beforeEach(async () => {
    const mockService = createMockStatsService();
    const setup = await createTestingModuleWithService(StatsController, StatsService, mockService);

    controller = setup.controller;
    statsService = setup.service as ReturnType<typeof createMockStatsService>;
  });

  describe("GET /api/stats", () => {
    it("retourne les stats avec status 200", async () => {
      const mockStats: StatOutput[] = [
        { description: "Test stat", stats: [{ value: 10, date: 1704067200000 }] },
      ];
      statsService.getAllStats.mockResolvedValue(mockStats);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getStats(undefined, undefined, req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    describe("validation de la periodicite", () => {
      it("utilise month par defaut si aucune periodicite fournie", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats(undefined, undefined, req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });

      it("utilise month par defaut si periodicite invalide", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("invalid", undefined, req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });

      it.each(["day", "week", "month", "year"] as const)(
        "accepte la periodicite '%s'",
        async (periodicity) => {
          const req = createMockRequest();
          const res = createMockResponse();

          await controller.getStats(periodicity, undefined, req, res);

          expect(statsService.getAllStats).toHaveBeenCalledWith(null, periodicity);
        },
      );

      it("rejette les periodicites invalides (hour, minute, quarter)", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("hour", undefined, req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });
    });

    describe("parametre since", () => {
      it("passe null si since non fourni", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("month", undefined, req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });

      it("passe une Date si since est un nombre valide", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("month", "12", req, res);

        const [since] = statsService.getAllStats.mock.calls[0] as [Date | null, string];
        expect(since).toBeInstanceOf(Date);
        expect(since).not.toBeNull();
      });

      it("passe null si since est 0", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("month", "0", req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });

      it("passe null si since est negatif", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("month", "-5", req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });

      it("passe null si since n'est pas un nombre", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("month", "abc", req, res);

        expect(statsService.getAllStats).toHaveBeenCalledWith(null, "month");
      });

      it("calcule une date correcte pour since=24 et periodicite month", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats("month", "24", req, res);

        const [since] = statsService.getAllStats.mock.calls[0] as [Date | null, string];
        expect(since).toBeInstanceOf(Date);
        // Doit etre environ 24 mois en arriere, tronque au 1er du mois
        expect((since as Date).getUTCDate()).toBe(1);
        expect((since as Date).getUTCHours()).toBe(0);
      });
    });

    describe("headers CORS", () => {
      it("ajoute le header CORS pour stats.incubateur.ademe.fr", async () => {
        const req = createMockRequest("https://stats.incubateur.ademe.fr");
        const res = createMockResponse();

        await controller.getStats(undefined, undefined, req, res);

        expect(res.setHeader).toHaveBeenCalledWith(
          "Access-Control-Allow-Origin",
          "https://stats.incubateur.ademe.fr",
        );
      });

      it("ajoute le header CORS pour stats.incubateur.ademe.dev", async () => {
        const req = createMockRequest("https://stats.incubateur.ademe.dev");
        const res = createMockResponse();

        await controller.getStats(undefined, undefined, req, res);

        expect(res.setHeader).toHaveBeenCalledWith(
          "Access-Control-Allow-Origin",
          "https://stats.incubateur.ademe.dev",
        );
      });

      it("n'ajoute pas de header CORS pour une origine non autorisee", async () => {
        const req = createMockRequest("https://malicious-site.com");
        const res = createMockResponse();

        await controller.getStats(undefined, undefined, req, res);

        const corsCall = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls.find(
          (call) => call[0] === "Access-Control-Allow-Origin",
        );
        expect(corsCall).toBeUndefined();
      });

      it("n'ajoute pas de header CORS sans origine", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats(undefined, undefined, req, res);

        const corsCall = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls.find(
          (call) => call[0] === "Access-Control-Allow-Origin",
        );
        expect(corsCall).toBeUndefined();
      });
    });

    describe("header Cache-Control", () => {
      it("ajoute un header Cache-Control", async () => {
        const req = createMockRequest();
        const res = createMockResponse();

        await controller.getStats(undefined, undefined, req, res);

        expect(res.setHeader).toHaveBeenCalledWith(
          "Cache-Control",
          expect.stringMatching(/^public, max-age=\d+$/),
        );
      });

      it("calcule un TTL adapte a la periodicite", async () => {
        const req = createMockRequest();
        const resDay = createMockResponse();
        const resYear = createMockResponse();

        await controller.getStats("day", undefined, req, resDay);
        await controller.getStats("year", undefined, req, resYear);

        const ttlDayCall = (resDay.setHeader as ReturnType<typeof vi.fn>).mock.calls.find(
          (call) => call[0] === "Cache-Control",
        );
        const ttlYearCall = (resYear.setHeader as ReturnType<typeof vi.fn>).mock.calls.find(
          (call) => call[0] === "Cache-Control",
        );

        const ttlDay = parseInt((ttlDayCall as string[])[1].replace("public, max-age=", ""), 10);
        const ttlYear = parseInt((ttlYearCall as string[])[1].replace("public, max-age=", ""), 10);

        // Le TTL jour doit etre inferieur au TTL annee
        expect(ttlDay).toBeLessThan(ttlYear);
      });
    });

    describe("propagation des erreurs", () => {
      it("propage les erreurs du service", async () => {
        statsService.getAllStats.mockRejectedValue(new Error("Database error"));

        const req = createMockRequest();
        const res = createMockResponse();

        await expect(controller.getStats(undefined, undefined, req, res)).rejects.toThrow(
          "Database error",
        );
      });
    });
  });

  describe("handleMethodNotAllowed", () => {
    it("retourne 405 Method Not Allowed", () => {
      const res = createMockResponse();

      controller.handleMethodNotAllowed(res);

      expect(res.setHeader).toHaveBeenCalledWith("Allow", "GET, OPTIONS");
      expect(res.status).toHaveBeenCalledWith(HttpStatus.METHOD_NOT_ALLOWED);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 405,
        message: "Method Not Allowed",
      });
    });
  });
});
