import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { EnedisService } from "./enedis.service";

type Dataset = "poste-electrique" | "reseau-bt" | "reseau-souterrain-bt";

// Format réel de Data-Fair : geometry est une chaîne JSON, pas un objet.
const poste = (distance: number, lat: number, lon: number): Record<string, unknown> => ({
  _id: `poste-${distance}`,
  _geo_distance: distance,
  _geopoint: `${lat},${lon}`,
  nom_commune: "Beaucouzé",
  geometry: JSON.stringify({ type: "Point", coordinates: [lon, lat] }),
});

const ligne = (distance: number): Record<string, unknown> => ({
  _id: `ligne-${distance}`,
  _geo_distance: distance,
  _geopoint: "47.4745,-0.6071",
  geometry: '{"type":"LineString","coordinates":[[-0.6071,47.4745],[-0.6070,47.4746]]}',
});

describe("EnedisService", () => {
  let service: EnedisService;
  let httpGet: ReturnType<typeof vi.fn>;

  const repondre = (resultats: Partial<Record<Dataset, Record<string, unknown>[]>>): void => {
    httpGet.mockImplementation((url: string) => {
      const dataset = (Object.keys(resultats) as Dataset[]).find((d) =>
        url.endsWith(`/${d}/lines`),
      );
      const results = dataset ? (resultats[dataset] ?? []) : [];
      return of({ data: { total: results.length, results } });
    });
  };

  beforeEach(() => {
    httpGet = vi.fn();
    service = new EnedisService({ get: httpGet } as unknown as HttpService);
  });

  it("retient un poste malgré une géométrie sérialisée en chaîne", async () => {
    repondre({ "poste-electrique": [poste(125, 47.4742615, -0.6088126)] });

    const res = await service.getDistanceRaccordement(47.4746, -0.6072);

    expect(res.success).toBe(true);
    expect(res.data?.distance).toBe(125);
    expect(res.data?.infrastructureProche?.type).toBe("poste");
    expect(res.data?.posteProche?.coordonnees).toEqual({
      latitude: 47.4742615,
      longitude: -0.6088126,
    });
  });

  it("interroge aussi le réseau BT souterrain", async () => {
    repondre({ "reseau-souterrain-bt": [ligne(54)] });

    const res = await service.getDistanceRaccordement(47.4746, -0.6072);

    const datasets = httpGet.mock.calls.map(([url]) => url as string);
    expect(datasets.some((url) => url.endsWith("/reseau-souterrain-bt/lines"))).toBe(true);
    expect(res.data?.distance).toBe(54);
    expect(res.data?.type).toBe("BT");
    expect(res.data?.capaciteDisponible).toBe(true);
  });

  it("retient l'infrastructure la plus proche, tous réseaux confondus", async () => {
    repondre({
      "poste-electrique": [poste(800, 47.48, -0.6)],
      "reseau-bt": [ligne(300)],
      "reseau-souterrain-bt": [ligne(150)],
    });

    const res = await service.getDistanceRaccordement(47.4746, -0.6072);

    expect(res.data?.distance).toBe(150);
    expect(res.data?.infrastructureProche?.type).toBe("ligne_bt");
    // Au-delà de 100 m, une extension de réseau est nécessaire
    expect(res.data?.type).toBe("HTA");
  });

  it("préfère le poste quand il est plus proche que la ligne BT", async () => {
    repondre({ "poste-electrique": [poste(120, 47.475, -0.607)], "reseau-bt": [ligne(400)] });

    const res = await service.getDistanceRaccordement(47.4746, -0.6072);

    expect(res.data?.distance).toBe(120);
    expect(res.data?.type).toBe("BT");
  });

  it("renvoie null quand aucune infrastructure n'est trouvée", async () => {
    repondre({});

    const res = await service.getDistanceRaccordement(47.4746, -0.6072);

    expect(res.success).toBe(true);
    expect(res.data?.distance).toBeNull();
  });

  it("ignore l'échec d'un dataset BT sans faire échouer le raccordement", async () => {
    httpGet.mockImplementation((url: string) => {
      if (url.endsWith("/reseau-souterrain-bt/lines")) throw new Error("503");
      return of({ data: { total: 1, results: [ligne(60)] } });
    });

    const res = await service.getDistanceRaccordement(47.4746, -0.6072);

    expect(res.success).toBe(true);
    expect(res.data?.distance).toBe(60);
  });
});
