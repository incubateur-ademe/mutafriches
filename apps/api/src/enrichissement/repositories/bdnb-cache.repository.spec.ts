import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { BdnbCacheRepository } from "./bdnb-cache.repository";
import { DatabaseService } from "../../shared/database/database.service";

describe("BdnbCacheRepository", () => {
  let repository: BdnbCacheRepository;
  let where: ReturnType<typeof vi.fn>;
  let onConflictDoUpdate: ReturnType<typeof vi.fn>;
  let values: ReturnType<typeof vi.fn>;
  let insert: ReturnType<typeof vi.fn>;
  let select: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    where = vi.fn();
    select = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where }) });
    onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    insert = vi.fn().mockReturnValue({ values });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BdnbCacheRepository,
        { provide: DatabaseService, useValue: { db: { select, insert } } },
      ],
    }).compile();
    repository = module.get<BdnbCacheRepository>(BdnbCacheRepository);
  });

  describe("findByParcelles", () => {
    it("indexe les entrées trouvées par identifiant de parcelle", async () => {
      const date = new Date("2026-10-01T00:00:00Z");
      where.mockResolvedValue([
        { parcelleId: "49020000AK0118", surfaceBati: 69, groupes: [], dateRecuperation: date },
      ]);

      const entrees = await repository.findByParcelles(["49020000AK0118", "49020000AK0119"]);

      expect(entrees.size).toBe(1);
      expect(entrees.get("49020000AK0118")?.surfaceBati).toBe(69);
    });

    it("ne requête pas la base pour une liste vide", async () => {
      const entrees = await repository.findByParcelles([]);

      expect(entrees.size).toBe(0);
      expect(select).not.toHaveBeenCalled();
    });

    it("renvoie une table vide si la lecture échoue", async () => {
      where.mockRejectedValue(new Error("connexion perdue"));

      const entrees = await repository.findByParcelles(["49020000AK0118"]);

      expect(entrees.size).toBe(0);
    });
  });

  describe("enregistrer", () => {
    it("insère en lot avec mise à jour en cas de conflit", async () => {
      const entrees = [
        { parcelleId: "49020000AK0118", surfaceBati: 69, groupes: [{ id: "bg-1", surface: 69 }] },
        { parcelleId: "49020000AK0119", surfaceBati: 0, groupes: [] },
      ];

      await repository.enregistrer(entrees);

      expect(values).toHaveBeenCalledWith(entrees);
      expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
    });

    it("n'écrit rien pour une liste vide", async () => {
      await repository.enregistrer([]);

      expect(insert).not.toHaveBeenCalled();
    });

    it("n'interrompt pas l'enrichissement si l'écriture échoue", async () => {
      onConflictDoUpdate.mockRejectedValue(new Error("disque plein"));

      await expect(
        repository.enregistrer([{ parcelleId: "49020000AK0118", surfaceBati: 1, groupes: [] }]),
      ).resolves.toBeUndefined();
    });
  });
});
