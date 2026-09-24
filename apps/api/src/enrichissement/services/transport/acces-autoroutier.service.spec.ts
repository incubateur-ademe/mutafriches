import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { IgnWfsService } from "../../adapters/ign-wfs/ign-wfs.service";
import { IgnItineraireService } from "../../adapters/ign-itineraire/ign-itineraire.service";
import { AccesAutoroutierService } from "./acces-autoroutier.service";
import { AccesAutoroutierCalculator, EntreeAutoroutiere } from "./acces-autoroutier.calculator";

const site = { latitude: 48.735, longitude: 6.165 };

const entree = (distanceVolOiseauMetres: number): EntreeAutoroutiere => ({
  longitude: 6 + distanceVolOiseauMetres / 1e6,
  latitude: 48,
  distanceVolOiseauMetres,
});

describe("AccesAutoroutierService", () => {
  let service: AccesAutoroutierService;
  let getTroncons: ReturnType<typeof vi.fn>;
  let getDistanceRoutiere: ReturnType<typeof vi.fn>;
  let extraireEntrees: ReturnType<typeof vi.spyOn>;

  // Distance par la route renvoyée pour chaque entrée, indexée par sa distance à vol d'oiseau
  const routes = (parVolOiseau: Record<number, number | null>): void => {
    getDistanceRoutiere.mockImplementation((_depart: unknown, arrivee: EntreeAutoroutiere) => {
      const distance = parVolOiseau[arrivee.distanceVolOiseauMetres];
      return Promise.resolve(
        distance === null || distance === undefined
          ? { success: false, error: "échec", source: "IGN Itinéraire" }
          : { success: true, data: { distanceMetres: distance }, source: "IGN Itinéraire" },
      );
    });
  };

  beforeEach(() => {
    getTroncons = vi.fn().mockResolvedValue({ success: true, data: [], source: "IGN WFS" });
    getDistanceRoutiere = vi.fn();
    extraireEntrees = vi.spyOn(AccesAutoroutierCalculator, "extraireEntrees");
    service = new AccesAutoroutierService(
      { getTronconsAutoroutiers: getTroncons } as unknown as IgnWfsService,
      { getDistanceRoutiere } as unknown as IgnItineraireService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retient la plus courte distance par la route et s'arrête au premier rayon", async () => {
    extraireEntrees.mockReturnValueOnce([entree(800), entree(1150)]);
    routes({ 800: 2233, 1150: 2141 });

    const res = await service.calculerDistance(site);

    expect(res).toEqual({ statut: "trouve", distanceMetres: 2141, parLaRoute: true });
    expect(getTroncons).toHaveBeenCalledTimes(1);
    expect(getTroncons).toHaveBeenCalledWith(48.735, 6.165, 5000);
  });

  it("n'interroge pas les entrées plus éloignées à vol d'oiseau que la meilleure route", async () => {
    extraireEntrees.mockReturnValueOnce([entree(800), entree(1500), entree(3000)]);
    routes({ 800: 1200, 1500: 900 });

    const res = await service.calculerDistance(site);

    expect(getDistanceRoutiere).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ statut: "trouve", distanceMetres: 1200, parLaRoute: true });
  });

  it("élargit le rayon quand la route dépasse le rayon courant", async () => {
    extraireEntrees
      .mockReturnValueOnce([entree(4000)])
      .mockReturnValueOnce([entree(4000), entree(6000)]);
    routes({ 4000: 9000, 6000: 7000 });

    const res = await service.calculerDistance(site);

    expect(getTroncons).toHaveBeenNthCalledWith(2, 48.735, 6.165, 15000);
    // L'entrée déjà calculée n'est pas redemandée
    expect(getDistanceRoutiere).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ statut: "trouve", distanceMetres: 7000, parLaRoute: true });
  });

  it("plafonne le nombre d'itinéraires demandés", async () => {
    extraireEntrees.mockReturnValue([
      entree(100),
      entree(200),
      entree(300),
      entree(400),
      entree(500),
    ]);
    routes({});

    await service.calculerDistance(site);

    expect(getDistanceRoutiere).toHaveBeenCalledTimes(4);
  });

  it("se replie sur le vol d'oiseau si aucun itinéraire n'aboutit", async () => {
    extraireEntrees.mockReturnValueOnce([entree(1800), entree(2500)]);
    routes({});

    const res = await service.calculerDistance(site);

    expect(res).toEqual({ statut: "trouve", distanceMetres: 1800, parLaRoute: false });
  });

  it("renvoie « aucun » si aucun rayon ne contient d'entrée", async () => {
    extraireEntrees.mockReturnValue([]);

    const res = await service.calculerDistance(site);

    expect(res).toEqual({ statut: "aucun" });
    expect(getTroncons).toHaveBeenCalledTimes(3);
    expect(getDistanceRoutiere).not.toHaveBeenCalled();
  });

  it("renvoie une erreur si le WFS échoue", async () => {
    getTroncons.mockResolvedValue({ success: false, error: "503", source: "IGN WFS" });

    const res = await service.calculerDistance(site);

    expect(res).toEqual({ statut: "erreur", message: "503" });
  });
});
