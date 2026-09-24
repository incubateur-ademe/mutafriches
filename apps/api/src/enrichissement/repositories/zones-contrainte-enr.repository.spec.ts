import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ZonesContrainteEnrRepository } from "./zones-contrainte-enr.repository";
import { DatabaseService } from "../../shared/database/database.service";

// Sert `execute(sql)` (test spatial) et `select().from()` awaité (comptage de la table)
function mockDb(rows: unknown[], total = 2302) {
  const execute = vi.fn().mockResolvedValue(rows);
  const fromResult = {
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve([{ total }]).then(resolve, reject),
  };
  const from = vi.fn().mockReturnValue(fromResult);
  const select = vi.fn().mockReturnValue({ from });
  return { execute, select, from };
}

async function createRepository(
  db: ReturnType<typeof mockDb>,
): Promise<ZonesContrainteEnrRepository> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ZonesContrainteEnrRepository, { provide: DatabaseService, useValue: { db } }],
  }).compile();
  return module.get<ZonesContrainteEnrRepository>(ZonesContrainteEnrRepository);
}

describe("ZonesContrainteEnrRepository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne le statut de la zone contenant le point", async () => {
    const repository = await createRepository(mockDb([{ statut: "SATUREE" }]));

    await expect(repository.findStatutZoneContenant(47.46, -0.6)).resolves.toBe("SATUREE");
  });

  it("retourne null si aucune zone ne contient le point", async () => {
    const repository = await createRepository(mockDb([]));

    await expect(repository.findStatutZoneContenant(47.46, -0.6)).resolves.toBeNull();
  });

  it("retourne undefined si la lecture échoue techniquement", async () => {
    const db = mockDb([]);
    db.execute.mockRejectedValue(new Error("DB down"));
    const repository = await createRepository(db);

    await expect(repository.findStatutZoneContenant(47.46, -0.6)).resolves.toBeUndefined();
  });

  it("retourne undefined et alerte une seule fois si le référentiel est vide", async () => {
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([], 0));

    await expect(repository.findStatutZoneContenant(47.46, -0.6)).resolves.toBeUndefined();
    await repository.findStatutZoneContenant(48.85, 2.35);

    expect(erreur).toHaveBeenCalledTimes(1);
    expect(erreur.mock.calls[0][0]).toContain("db:zones-contrainte-enr:import");
  });
});
