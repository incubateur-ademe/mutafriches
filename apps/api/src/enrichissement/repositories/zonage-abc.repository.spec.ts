import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { ZonageAbcRepository } from "./zonage-abc.repository";
import { DatabaseService } from "../../shared/database/database.service";

/**
 * Mock du query-builder Drizzle, qui doit servir deux formes d'appel :
 * - `select().from().where().limit()` -> la commune recherchée
 * - `select({ total }).from()` (awaité directement) -> le comptage de la table
 */
function mockDb(rows: unknown[], total = 34875) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const fromResult = {
    where,
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve([{ total }]).then(resolve, reject),
  };
  const from = vi.fn().mockReturnValue(fromResult);
  const select = vi.fn().mockReturnValue({ from });
  return { select, from, where, limit };
}

async function createRepository(db: ReturnType<typeof mockDb>): Promise<ZonageAbcRepository> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ZonageAbcRepository, { provide: DatabaseService, useValue: { db } }],
  }).compile();
  return module.get<ZonageAbcRepository>(ZonageAbcRepository);
}

describe("ZonageAbcRepository", () => {
  const row = {
    codeInsee: "25056",
    nom: "Besançon",
    departement: "25",
    zonage: "b1",
    millesime: "26 juin 2026",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne le zonage d'une commune trouvée", async () => {
    const repository = await createRepository(mockDb([row]));

    const result = await repository.findByCodeInsee("25056");

    expect(result).toEqual({
      codeInsee: "25056",
      commune: "Besançon",
      zonage: ZonageAbcLogement.B1,
      millesime: "26 juin 2026",
    });
  });

  it("retourne null si la commune est absente du référentiel", async () => {
    // null = recherche effectuée sans résultat : le critère compte pour la fiabilité
    const repository = await createRepository(mockDb([]));

    await expect(repository.findByCodeInsee("00000")).resolves.toBeNull();
  });

  it("retourne undefined si la lecture échoue techniquement", async () => {
    const db = mockDb([]);
    db.limit.mockRejectedValue(new Error("DB down"));
    const repository = await createRepository(db);

    await expect(repository.findByCodeInsee("25056")).resolves.toBeUndefined();
  });

  it("alerte une seule fois si le référentiel est vide", async () => {
    // Sans cette alerte, un import jamais lancé dégraderait la fiabilité en silence
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([], 0));

    await repository.findByCodeInsee("25056");
    await repository.findByCodeInsee("49353");

    expect(erreur).toHaveBeenCalledTimes(1);
    expect(erreur.mock.calls[0][0]).toContain("db:zonage-abc:import");
  });

  it("n'alerte pas quand le référentiel est peuplé mais la commune inconnue", async () => {
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([]));

    await repository.findByCodeInsee("00000");

    expect(erreur).not.toHaveBeenCalled();
  });
});
