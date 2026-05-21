import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImportStatusService } from "./import-status.service";
import { DatabaseService } from "../shared/database/database.service";
import { IMPORT_DATASETS } from "./import-status.registry";

function createMockDatabaseService() {
  return {
    db: {
      execute: vi.fn(),
    },
  } as unknown as DatabaseService;
}

/**
 * Extrait le SQL textuel d'un objet Drizzle sql ou sql.raw, en incluant
 * les valeurs des paramètres interpolés. Suit le même pattern que stats.service.spec.ts.
 */
function extractSqlContent(sqlObj: unknown): string {
  if (typeof sqlObj === "string") return sqlObj;

  const obj = sqlObj as Record<string, unknown>;
  if (obj && Array.isArray(obj.queryChunks)) {
    return (obj.queryChunks as unknown[])
      .map((chunk) => {
        if (typeof chunk === "string") return chunk;
        const c = chunk as Record<string, unknown>;
        if (c && typeof c.value === "string") return c.value;
        if (c && Array.isArray(c.queryChunks)) return extractSqlContent(c);
        if (c && "value" in c) return String(c.value);
        return String(chunk);
      })
      .join("");
  }

  try {
    return JSON.stringify(sqlObj);
  } catch {
    return String(sqlObj);
  }
}

/**
 * Dispatche les appels db.execute selon le contenu SQL :
 * - SELECT FROM raw_imports_log avec un pattern → renvoie le log fourni
 * - SELECT COUNT(*) FROM <table> → renvoie le count fourni
 */
function setupDbMock(
  dbExecute: ReturnType<typeof vi.fn>,
  options: {
    logsByPattern?: Record<string, unknown[]>;
    countsByTable?: Record<string, number>;
    throwOnTable?: string;
  },
) {
  dbExecute.mockImplementation((query: unknown) => {
    const text = extractSqlContent(query);

    if (text.includes("raw_imports_log")) {
      for (const pattern of Object.keys(options.logsByPattern ?? {})) {
        if (text.includes(pattern)) {
          return Promise.resolve(options.logsByPattern![pattern]);
        }
      }
      return Promise.resolve([]);
    }

    if (text.includes("COUNT(*)")) {
      for (const tableName of Object.keys(options.countsByTable ?? {})) {
        // Utilise une regex avec word boundary pour éviter les correspondances partielles
        const regex = new RegExp(`\\b${tableName}\\b`);
        if (regex.test(text)) {
          if (options.throwOnTable === tableName) {
            return Promise.reject(new Error("Table missing"));
          }
          return Promise.resolve([{ count: options.countsByTable![tableName] }]);
        }
      }
      return Promise.resolve([{ count: 0 }]);
    }

    return Promise.resolve([]);
  });
}

describe("ImportStatusService", () => {
  let service: ImportStatusService;
  let databaseService: DatabaseService;
  let dbExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    databaseService = createMockDatabaseService();
    dbExecute = databaseService.db.execute as ReturnType<typeof vi.fn>;
    service = new ImportStatusService(databaseService);
  });

  it("retourne un item pour chaque dataset du registre", async () => {
    setupDbMock(dbExecute, {});

    const result = await service.getStatus();

    expect(result.imports).toHaveLength(IMPORT_DATASETS.length);
    expect(result.imports.map((i) => i.key)).toEqual(IMPORT_DATASETS.map((d) => d.key));
  });

  it("retourne status 'never' quand aucun log n'existe", async () => {
    setupDbMock(dbExecute, {
      countsByTable: { raw_bpe: 0 },
    });

    const result = await service.getStatus();
    const bpe = result.imports.find((i) => i.key === "bpe");

    expect(bpe?.status).toBe("never");
    expect(bpe?.lastImportAt).toBeNull();
    expect(bpe?.rowsImported).toBeNull();
    expect(bpe?.sourcePath).toBeNull();
  });

  it("retourne status 'success' et les données du dernier log", async () => {
    setupDbMock(dbExecute, {
      logsByPattern: {
        "donnees-bpe-2024": [
          {
            status: "success",
            rows_imported: 12345,
            finished_at: new Date("2026-05-20T10:00:00Z"),
            started_at: new Date("2026-05-20T09:55:00Z"),
            source_path: "/data/bpe.csv",
            file_size_bytes: 1048576,
          },
        ],
      },
      countsByTable: { raw_bpe: 12345 },
    });

    const result = await service.getStatus();
    const bpe = result.imports.find((i) => i.key === "bpe");

    expect(bpe?.status).toBe("success");
    expect(bpe?.rowsInDb).toBe(12345);
    expect(bpe?.rowsImported).toBe(12345);
    expect(bpe?.lastImportAt).toBe("2026-05-20T10:00:00.000Z");
    expect(bpe?.sourcePath).toBe("/data/bpe.csv");
    expect(bpe?.fileSizeBytes).toBe(1048576);
  });

  it("utilise started_at si finished_at est null (import en cours)", async () => {
    setupDbMock(dbExecute, {
      logsByPattern: {
        "ite-fret": [
          {
            status: "running",
            rows_imported: 0,
            finished_at: null,
            started_at: new Date("2026-05-21T08:00:00Z"),
            source_path: "/data/ite.geojson",
            file_size_bytes: null,
          },
        ],
      },
      countsByTable: { raw_ite_fret: 0 },
    });

    const result = await service.getStatus();
    const ite = result.imports.find((i) => i.key === "ite-fret");

    expect(ite?.status).toBe("running");
    expect(ite?.lastImportAt).toBe("2026-05-21T08:00:00.000Z");
  });

  it("marque hasEmptyImport quand un dataset a 0 ligne en base", async () => {
    setupDbMock(dbExecute, {
      countsByTable: {
        raw_bpe: 100,
        raw_transport_stops: 0,
        raw_ademe_sites_pollues: 50,
        raw_ite_fret: 25,
        communes: 35000,
      },
    });

    const result = await service.getStatus();

    expect(result.hasEmptyImport).toBe(true);
  });

  it("marque hasFailedImport quand un dataset est en erreur", async () => {
    setupDbMock(dbExecute, {
      logsByPattern: {
        "ademe-sites-pollues": [
          {
            status: "failed",
            rows_imported: 0,
            finished_at: new Date("2026-05-19T12:00:00Z"),
            started_at: new Date("2026-05-19T11:55:00Z"),
            source_path: "/data/ademe.geojson",
            file_size_bytes: 0,
          },
        ],
      },
      countsByTable: {
        raw_bpe: 100,
        raw_transport_stops: 200,
        raw_ademe_sites_pollues: 0,
        raw_ite_fret: 25,
        communes: 35000,
      },
    });

    const result = await service.getStatus();

    expect(result.hasFailedImport).toBe(true);
    const ademe = result.imports.find((i) => i.key === "ademe-sites");
    expect(ademe?.status).toBe("failed");
  });

  it("retrouve le log du dataset versionné via LIKE (découpage administratif)", async () => {
    setupDbMock(dbExecute, {
      logsByPattern: {
        "decoupage-administratif-etalab-%": [
          {
            status: "success",
            rows_imported: 35000,
            finished_at: new Date("2026-04-10T08:00:00Z"),
            started_at: new Date("2026-04-10T07:55:00Z"),
            source_path:
              "https://unpkg.com/@etalab/decoupage-administratif@5.3.0/data/communes.json",
            file_size_bytes: null,
          },
        ],
      },
      countsByTable: { communes: 35000 },
    });

    const result = await service.getStatus();
    const decoupage = result.imports.find((i) => i.key === "decoupage-administratif");

    expect(decoupage?.status).toBe("success");
    expect(decoupage?.rowsInDb).toBe(35000);
    expect(decoupage?.sourcePath).toContain("5.3.0");
  });

  it("retourne rowsInDb=0 si la table n'existe pas (table manquante)", async () => {
    setupDbMock(dbExecute, {
      throwOnTable: "raw_bpe",
      countsByTable: { raw_bpe: 0 },
    });

    const result = await service.getStatus();
    const bpe = result.imports.find((i) => i.key === "bpe");

    expect(bpe?.rowsInDb).toBe(0);
  });

  it("inclut generatedAt au format ISO", async () => {
    setupDbMock(dbExecute, {});

    const result = await service.getStatus();

    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
