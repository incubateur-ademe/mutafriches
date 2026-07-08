import { describe, it, expect, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { LovacRepository } from "./lovac.repository";
import { DatabaseService } from "../../shared/database/database.service";

/**
 * Construit un mock du query-builder Drizzle qui résout `limit()` avec `rows`.
 */
function mockDb(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  return { select, from, where, limit };
}

describe("LovacRepository", () => {
  let repository: LovacRepository;
  let db: ReturnType<typeof mockDb>;

  async function createRepository(rows: unknown[]): Promise<void> {
    db = mockDb(rows);
    const module: TestingModule = await Test.createTestingModule({
      providers: [LovacRepository, { provide: DatabaseService, useValue: { db } }],
    }).compile();
    repository = module.get<LovacRepository>(LovacRepository);
  }

  const row = {
    codeInsee: "49007",
    nom: "Angers",
    nombreLogementsTotal: 86234,
    nombreLogementsVacants: 6789,
    nombreLogementsVacantsPlus2ans: 4123,
    millesime: 2026,
  };

  it("retourne les donnees d'une commune trouvee par code INSEE", async () => {
    await createRepository([row]);

    const result = await repository.findByCommune({ codeInsee: "49007" });

    expect(result).toEqual({
      codeInsee: "49007",
      commune: "Angers",
      nombreLogementsTotal: 86234,
      nombreLogementsVacants: 6789,
      nombreLogementsVacantsPlus2ans: 4123,
      millesime: 2026,
    });
  });

  it("recherche par nom si pas de code INSEE", async () => {
    await createRepository([row]);

    const result = await repository.findByCommune({ nomCommune: "Angers" });

    expect(result?.commune).toBe("Angers");
    expect(db.where).toHaveBeenCalled();
  });

  it("retourne null si aucune commune trouvee", async () => {
    await createRepository([]);

    const result = await repository.findByCommune({ codeInsee: "00000" });

    expect(result).toBeNull();
  });

  it("retourne null si ni code INSEE ni nom", async () => {
    await createRepository([]);

    const result = await repository.findByCommune({});

    expect(result).toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("retourne null en cas d'erreur de lecture", async () => {
    db = mockDb([]);
    db.limit.mockRejectedValue(new Error("DB down"));
    const module: TestingModule = await Test.createTestingModule({
      providers: [LovacRepository, { provide: DatabaseService, useValue: { db } }],
    }).compile();
    repository = module.get<LovacRepository>(LovacRepository);

    const result = await repository.findByCommune({ codeInsee: "49007" });

    expect(result).toBeNull();
  });
});
