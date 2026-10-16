import { describe, it, expect, beforeEach, vi } from "vitest";
import { SurfaceBatieService, BDNB_CACHE_TTL_JOURS } from "./surface-batie.service";
import { BdnbService } from "../../adapters/bdnb/bdnb.service";
import { BdnbCacheRepository, EntreeCacheBdnb } from "../../repositories/bdnb-cache.repository";

const JOUR_MS = 24 * 60 * 60 * 1000;

const entree = (
  parcelleId: string,
  surfaceBati: number,
  ageJours: number,
): [string, EntreeCacheBdnb] => [
  parcelleId,
  {
    parcelleId,
    surfaceBati,
    groupes: [],
    dateRecuperation: new Date(Date.now() - ageJours * JOUR_MS),
  },
];

const idParcelle = (n: number): string => `49020000AK${String(n).padStart(4, "0")}`;

describe("SurfaceBatieService", () => {
  let service: SurfaceBatieService;
  let getSurfacesBatiesParLot: ReturnType<typeof vi.fn>;
  let findByParcelles: ReturnType<typeof vi.fn>;
  let enregistrer: ReturnType<typeof vi.fn>;

  const bdnbRepond = (surfaces: Record<string, number>): void => {
    getSurfacesBatiesParLot.mockImplementation((ids: string[]) =>
      Promise.resolve({
        success: true,
        data: new Map(
          ids.map((id) => [
            id,
            {
              surface: surfaces[id] ?? 0,
              groupes: [{ id: `bg-${id}`, surface: surfaces[id] ?? 0 }],
            },
          ]),
        ),
      }),
    );
  };

  beforeEach(() => {
    getSurfacesBatiesParLot = vi.fn();
    findByParcelles = vi.fn().mockResolvedValue(new Map());
    enregistrer = vi.fn().mockResolvedValue(undefined);
    service = new SurfaceBatieService(
      { getSurfacesBatiesParLot } as unknown as BdnbService,
      { findByParcelles, enregistrer } as unknown as BdnbCacheRepository,
    );
  });

  it("sert une parcelle en cache récent sans appeler la BDNB", async () => {
    findByParcelles.mockResolvedValue(new Map([entree(idParcelle(118), 69, 5)]));

    const surfaces = await service.getSurfaces([idParcelle(118)]);

    expect(surfaces.get(idParcelle(118))).toBe(69);
    expect(getSurfacesBatiesParLot).not.toHaveBeenCalled();
    expect(enregistrer).toHaveBeenCalledWith([]);
  });

  it("interroge la BDNB pour une parcelle absente et l'enregistre au cache", async () => {
    bdnbRepond({ [idParcelle(118)]: 69 });

    const surfaces = await service.getSurfaces([idParcelle(118)]);

    expect(surfaces.get(idParcelle(118))).toBe(69);
    expect(enregistrer).toHaveBeenCalledWith([
      expect.objectContaining({ parcelleId: idParcelle(118), surfaceBati: 69 }),
    ]);
  });

  it("met en cache une parcelle non bâtie (0 est une réponse valide)", async () => {
    bdnbRepond({});

    const surfaces = await service.getSurfaces([idParcelle(1)]);

    expect(surfaces.get(idParcelle(1))).toBe(0);
    expect(enregistrer).toHaveBeenCalledWith([
      expect.objectContaining({ parcelleId: idParcelle(1), surfaceBati: 0 }),
    ]);
  });

  it("réinterroge une entrée plus vieille que le TTL", async () => {
    findByParcelles.mockResolvedValue(
      new Map([entree(idParcelle(118), 50, BDNB_CACHE_TTL_JOURS + 1)]),
    );
    bdnbRepond({ [idParcelle(118)]: 69 });

    const surfaces = await service.getSurfaces([idParcelle(118)]);

    expect(surfaces.get(idParcelle(118))).toBe(69);
    expect(getSurfacesBatiesParLot).toHaveBeenCalledTimes(1);
  });

  it("garde la valeur périmée quand la BDNB est indisponible", async () => {
    findByParcelles.mockResolvedValue(
      new Map([entree(idParcelle(118), 50, BDNB_CACHE_TTL_JOURS + 10)]),
    );
    getSurfacesBatiesParLot.mockResolvedValue({ success: false, error: "Quota mensuel épuisé" });

    const surfaces = await service.getSurfaces([idParcelle(118)]);

    expect(surfaces.get(idParcelle(118))).toBe(50);
    expect(enregistrer).toHaveBeenCalledWith([]);
  });

  it("renvoie null sans rien mettre en cache quand la BDNB échoue pour une parcelle inconnue", async () => {
    getSurfacesBatiesParLot.mockResolvedValue({ success: false, error: "429" });

    const surfaces = await service.getSurfaces([idParcelle(118)]);

    expect(surfaces.get(idParcelle(118))).toBeNull();
    expect(enregistrer).toHaveBeenCalledWith([]);
  });

  it("groupe les parcelles manquantes par appels de 10", async () => {
    const ids = Array.from({ length: 25 }, (_, i) => idParcelle(i + 1));
    bdnbRepond({});

    await service.getSurfaces(ids);

    const tailles = getSurfacesBatiesParLot.mock.calls.map((a) => (a[0] as string[]).length);
    expect(tailles.sort((a, b) => b - a)).toEqual([10, 10, 5]);
  });

  it("n'interroge que les parcelles manquantes d'un site partiellement en cache", async () => {
    findByParcelles.mockResolvedValue(new Map([entree(idParcelle(1), 100, 2)]));
    bdnbRepond({ [idParcelle(2)]: 40 });

    const surfaces = await service.getSurfaces([idParcelle(1), idParcelle(2)]);

    expect(getSurfacesBatiesParLot).toHaveBeenCalledWith([idParcelle(2)]);
    expect(surfaces.get(idParcelle(1))).toBe(100);
    expect(surfaces.get(idParcelle(2))).toBe(40);
  });

  it("dédoublonne les identifiants répétés", async () => {
    bdnbRepond({ [idParcelle(1)]: 10 });

    await service.getSurfaces([idParcelle(1), idParcelle(1)]);

    expect(getSurfacesBatiesParLot).toHaveBeenCalledWith([idParcelle(1)]);
  });

  it("borne le nombre d'appels groupés simultanés", async () => {
    const ids = Array.from({ length: 80 }, (_, i) => idParcelle(i + 1));
    let enCours = 0;
    let maximum = 0;
    getSurfacesBatiesParLot.mockImplementation(async (lot: string[]) => {
      enCours += 1;
      maximum = Math.max(maximum, enCours);
      await new Promise((resolve) => setTimeout(resolve, 1));
      enCours -= 1;
      return {
        success: true,
        data: new Map(lot.map((id) => [id, { surface: 0, groupes: [] }])),
      };
    });

    await service.getSurfaces(ids);

    expect(getSurfacesBatiesParLot).toHaveBeenCalledTimes(8);
    expect(maximum).toBeLessThanOrEqual(5);
  });
});
