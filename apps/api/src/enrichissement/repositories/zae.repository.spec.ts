import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ZaeRepository } from "./zae.repository";
import { DatabaseService } from "../../shared/database/database.service";

// Le mock sert deux formes d'appel : `execute(sql)` (test spatial) et `select().from()` (comptage)
function mockDb(rows: unknown[], total = 44991) {
  const execute = vi.fn().mockResolvedValue(rows);
  const fromResult = {
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve([{ total }]).then(resolve, reject),
  };
  const from = vi.fn().mockReturnValue(fromResult);
  const select = vi.fn().mockReturnValue({ from });
  return { execute, select, from };
}

async function createRepository(db: ReturnType<typeof mockDb>): Promise<ZaeRepository> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ZaeRepository, { provide: DatabaseService, useValue: { db } }],
  }).compile();
  return module.get<ZaeRepository>(ZaeRepository);
}

describe("ZaeRepository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne true si le point est dans une zone d'activité", async () => {
    const repository = await createRepository(mockDb([{ trouve: 1 }]));

    await expect(repository.estDansZae(47.25, 6.03)).resolves.toBe(true);
  });

  it("retourne false si le point est hors de toute zone d'activité", async () => {
    // false = recherche effectuée sans résultat : le critère compte pour la fiabilité
    const repository = await createRepository(mockDb([]));

    await expect(repository.estDansZae(47.25, 6.03)).resolves.toBe(false);
  });

  it("retourne undefined si la lecture échoue techniquement", async () => {
    const db = mockDb([]);
    db.execute.mockRejectedValue(new Error("DB down"));
    const repository = await createRepository(db);

    await expect(repository.estDansZae(47.25, 6.03)).resolves.toBeUndefined();
  });

  it("retourne undefined, et non false, si le référentiel est vide", async () => {
    const repository = await createRepository(mockDb([], 0));

    await expect(repository.estDansZae(47.25, 6.03)).resolves.toBeUndefined();
  });

  it("alerte une seule fois si le référentiel est vide", async () => {
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([], 0));

    await repository.estDansZae(47.25, 6.03);
    await repository.estDansZae(48.85, 2.35);

    expect(erreur).toHaveBeenCalledTimes(1);
    expect(erreur.mock.calls[0][0]).toContain("db:zae:import");
  });

  it("n'alerte pas quand le référentiel est peuplé mais le site hors ZAE", async () => {
    const erreur = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const repository = await createRepository(mockDb([]));

    await repository.estDansZae(47.25, 6.03);

    expect(erreur).not.toHaveBeenCalled();
  });
});
