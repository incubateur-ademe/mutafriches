import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { StatsService } from "./stats.service";
import { DatabaseService } from "../shared/database/database.service";

/**
 * Crée un mock du DatabaseService avec db.execute
 */
function createMockDatabaseService() {
  return {
    db: {
      execute: vi.fn().mockResolvedValue([]),
    },
  } as unknown as DatabaseService;
}

/**
 * Crée un résultat de requête simulant un retour PostgreSQL pour DATE_TRUNC
 * Les dates sont en UTC (comme avec AT TIME ZONE 'UTC')
 */
function createPeriodRow(dateIso: string, value: number) {
  return { period: new Date(dateIso), value };
}

/**
 * Extrait le contenu SQL lisible depuis un objet Drizzle sql ou sql.raw
 * Gère les cas : string brute (sql.raw) et objet SQL Drizzle (sql tagged template)
 */
function extractSqlContent(sqlObj: unknown): string {
  if (typeof sqlObj === "string") return sqlObj;

  // Drizzle sql tagged template : inspecter queryChunks
  const obj = sqlObj as Record<string, unknown>;
  if (obj && Array.isArray(obj.queryChunks)) {
    return (obj.queryChunks as unknown[])
      .map((chunk) => {
        if (typeof chunk === "string") return chunk;
        const c = chunk as Record<string, unknown>;
        // sql.raw fragments
        if (c && typeof c.value === "string") return c.value;
        if (c && Array.isArray(c.queryChunks)) return extractSqlContent(c);
        // Paramètre (valeur interpolée)
        if (c && "value" in c) return String(c.value);
        return String(chunk);
      })
      .join("");
  }

  // Fallback : essayer JSON
  try {
    return JSON.stringify(sqlObj);
  } catch {
    return String(sqlObj);
  }
}

describe("StatsService", () => {
  let service: StatsService;
  let databaseService: DatabaseService;
  let dbExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    databaseService = createMockDatabaseService();
    dbExecute = databaseService.db.execute as ReturnType<typeof vi.fn>;
    service = new StatsService(databaseService as DatabaseService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getAllStats", () => {
    it("retourne 6 statistiques", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      const result = await service.getAllStats(null, "month");

      expect(result).toHaveLength(6);
    });

    it("retourne les 6 descriptions attendues", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      const result = await service.getAllStats(null, "month");

      const descriptions = result.map((s) => s.description);
      expect(descriptions).toContain("Analyses de mutabilité abouties");
      expect(descriptions).toContain("Surface analysée (hectares, parcelles uniques)");
      expect(descriptions).toContain("Communes distinctes avec analyse aboutie");
      expect(descriptions).toContain("Visites");
      expect(descriptions).toContain("Sites qualifiés automatiquement");
      expect(descriptions).toContain("Nombre moyen de sites analysés par commune");
    });

    it("appelle db.execute 6 fois (une par stat)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      await service.getAllStats(null, "month");

      expect(dbExecute).toHaveBeenCalledTimes(6);
    });

    it("retourne des stats avec tableaux vides quand la base est vide et sans since", async () => {
      const result = await service.getAllStats(null, "month");

      for (const stat of result) {
        expect(stat.stats).toEqual([]);
      }
    });

    it("retourne des stats gap-filled avec zéros quand since est fourni et base vide", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

      const since = new Date("2025-01-01T00:00:00Z");
      const result = await service.getAllStats(since, "month");

      for (const stat of result) {
        // 3 mois : jan, fév, mar
        expect(stat.stats).toHaveLength(3);
        expect(stat.stats.every((s) => s.value === 0)).toBe(true);
      }
    });
  });

  describe("getAllStats avec données", () => {
    it("mappe correctement les lignes retournées par la base", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

      dbExecute
        // getAnalysesAbouties (queryByPeriod)
        .mockResolvedValueOnce([
          createPeriodRow("2025-01-01T00:00:00Z", 10),
          createPeriodRow("2025-02-01T00:00:00Z", 15),
          createPeriodRow("2025-03-01T00:00:00Z", 5),
        ])
        // getSurfaceAnalysee
        .mockResolvedValueOnce([
          createPeriodRow("2025-01-01T00:00:00Z", 2.5),
          createPeriodRow("2025-02-01T00:00:00Z", 3.1),
        ])
        // getCommunesDistinctes
        .mockResolvedValueOnce([createPeriodRow("2025-01-01T00:00:00Z", 4)])
        // getVisites (queryByPeriod)
        .mockResolvedValueOnce([
          createPeriodRow("2025-01-01T00:00:00Z", 100),
          createPeriodRow("2025-02-01T00:00:00Z", 200),
          createPeriodRow("2025-03-01T00:00:00Z", 150),
        ])
        // getSitesQualifies (queryByPeriod)
        .mockResolvedValueOnce([createPeriodRow("2025-02-01T00:00:00Z", 8)])
        // getMoyenneSitesParCommune
        .mockResolvedValueOnce([createPeriodRow("2025-01-01T00:00:00Z", 1.5)]);

      const since = new Date("2025-01-01T00:00:00Z");
      const result = await service.getAllStats(since, "month");

      // Analyses abouties : 3 mois avec données
      const analyses = result[0];
      expect(analyses.description).toBe("Analyses de mutabilité abouties");
      expect(analyses.stats).toHaveLength(3);
      expect(analyses.stats[0].value).toBe(10);
      expect(analyses.stats[1].value).toBe(15);
      expect(analyses.stats[2].value).toBe(5);

      // Surface analysée : 2 mois remplis, 1 mois gap-filled à 0
      const surface = result[1];
      expect(surface.description).toBe("Surface analysée (hectares, parcelles uniques)");
      expect(surface.stats).toHaveLength(3);
      expect(surface.stats[0].value).toBe(2.5);
      expect(surface.stats[1].value).toBe(3.1);
      expect(surface.stats[2].value).toBe(0); // gap-filled

      // Communes : 1 mois rempli, 2 gap-filled
      const communes = result[2];
      expect(communes.stats[0].value).toBe(4);
      expect(communes.stats[1].value).toBe(0);
      expect(communes.stats[2].value).toBe(0);

      // Visites : tous remplis
      const visites = result[3];
      expect(visites.stats[0].value).toBe(100);
      expect(visites.stats[1].value).toBe(200);
      expect(visites.stats[2].value).toBe(150);

      // Sites qualifiés : 1 rempli en février
      const qualifies = result[4];
      expect(qualifies.stats[0].value).toBe(0); // jan
      expect(qualifies.stats[1].value).toBe(8); // fév
      expect(qualifies.stats[2].value).toBe(0); // mar

      // Moyenne par commune
      const moyenne = result[5];
      expect(moyenne.stats[0].value).toBe(1.5);
    });

    it("gap-fill les périodes manquantes avec 0", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

      // Seulement des données en janvier pour toutes les stats
      dbExecute.mockResolvedValue([createPeriodRow("2025-01-01T00:00:00Z", 42)]);

      const since = new Date("2025-01-01T00:00:00Z");
      const result = await service.getAllStats(since, "month");

      // Chaque stat doit avoir 3 mois : jan (42), fév (0), mar (0)
      for (const stat of result) {
        expect(stat.stats).toHaveLength(3);
        expect(stat.stats[0].value).toBe(42);
        expect(stat.stats[1].value).toBe(0);
        expect(stat.stats[2].value).toBe(0);
      }
    });
  });

  describe("requêtes SQL générées", () => {
    it("utilise site_id et non parcelle_id dans les requêtes", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      await service.getAllStats(null, "month");

      // Inspecter les appels db.execute pour vérifier le SQL généré
      const calls = dbExecute.mock.calls;
      const allQueries = calls.map((call) => extractSqlContent(call[0])).join(" ");

      expect(allQueries).toContain("site_id");
      expect(allQueries).not.toContain("parcelle_id");
    });

    it("inclut AT TIME ZONE 'UTC' pour la normalisation timezone", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      await service.getAllStats(null, "month");

      const calls = dbExecute.mock.calls;
      const allQueries = calls.map((call) => extractSqlContent(call[0])).join(" ");

      expect(allQueries).toContain("AT TIME ZONE 'UTC'");
    });

    it("passe since en ISO string et non en objet Date", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      const since = new Date("2025-01-01T00:00:00Z");
      await service.getAllStats(since, "month");

      const calls = dbExecute.mock.calls;
      const allQueries = calls.map((call) => extractSqlContent(call[0])).join(" ");

      // La date ISO string doit apparaitre (pas un objet Date brut)
      expect(allQueries).toContain("2025-01-01T00:00:00.000Z");
    });

    it("utilise la bonne périodicité dans les DATE_TRUNC", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

      await service.getAllStats(null, "week");

      const calls = dbExecute.mock.calls;
      const allQueries = calls.map((call) => extractSqlContent(call[0])).join(" ");

      expect(allQueries).toContain("DATE_TRUNC('week'");
    });
  });

  describe("gestion des erreurs", () => {
    it("propage les erreurs de la base de données", async () => {
      dbExecute.mockRejectedValue(new Error("Connection refused"));

      await expect(service.getAllStats(null, "month")).rejects.toThrow("Connection refused");
    });
  });
});
