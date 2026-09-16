import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { QpvRepository } from "./qpv.repository";
import { DatabaseService } from "../../shared/database/database.service";

/**
 * Mock du query-builder Drizzle, qui doit servir deux formes d'appel :
 * - `execute(sql)` -> le test spatial ST_Intersects
 * - `select({ total }).from()` (awaité directement) -> le comptage de la table
 */
function mockDb(rows: unknown[], total = 1584) {
  const execute = vi.fn().mockResolvedValue(rows);
  const fromResult = {
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve([{ total }]).then(resolve, reject),
  };
  const from = vi.fn().mockReturnValue(fromResult);
  const select = vi.fn().mockReturnValue({ from });
  return { execute, select, from };
}

async function createRepository(db: ReturnType<typeof mockDb>): Promise<QpvRepository> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [QpvRepository, { provide: DatabaseService, useValue: { db } }],
  }).compile();
  return module.get<QpvRepository>(QpvRepository);
}

describe("QpvRepository", () => {
  const row = { code_qpv: "QN00101M", nom_qpv: "Grande Reyssouze Terre Des Fleurs" };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne le quartier contenant le point", async () => {
    const repository = await createRepository(mockDb([row]));

    const result = await repository.findQuartierContenant(46.21111, 5.23681);

    expect(result).toEqual({
      codeQpv: "QN00101M",
      nomQpv: "Grande Reyssouze Terre Des Fleurs",
    });
  });

  it("retourne null si le site n'est dans aucun quartier prioritaire", async () => {
    // null = recherche effectuée sans résultat : le critère compte pour la fiabilité
    const repository = await createRepository(mockDb([]));

    await expect(repository.findQuartierContenant(47.25, 6.03)).resolves.toBeNull();
  });

  it("retourne undefined si la lecture échoue techniquement", async () => {
    const db = mockDb([]);
    db.execute.mockRejectedValue(new Error("DB down"));
    const repository = await createRepository(db);

    await expect(repository.findQuartierContenant(47.25, 6.03)).resolves.toBeUndefined();
  });

  it("retourne undefined, et non null, si le référentiel est vide", async () => {
    // Le critère étant scoré, un référentiel non importé ne doit jamais produire un « Non » :
    // ce serait un résultat plausible, donc indétectable.
    const repository = await createRepository(mockDb([], 0));

    await expect(repository.findQuartierContenant(47.25, 6.03)).resolves.toBeUndefined();
  });

  it("alerte une seule fois si le référentiel est vide", async () => {
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([], 0));

    await repository.findQuartierContenant(47.25, 6.03);
    await repository.findQuartierContenant(48.85, 2.35);

    expect(erreur).toHaveBeenCalledTimes(1);
    expect(erreur.mock.calls[0][0]).toContain("db:qpv:import");
  });

  it("n'alerte pas quand le référentiel est peuplé mais le site hors QPV", async () => {
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([]));

    await repository.findQuartierContenant(47.25, 6.03);

    expect(erreur).not.toHaveBeenCalled();
  });
});
