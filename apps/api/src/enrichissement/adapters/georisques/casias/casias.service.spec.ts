import { describe, it, expect, beforeEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { CasiasService } from "./casias.service";
import { GEORISQUES_RAYONS_DEFAUT, GEORISQUES_SOURCES } from "../georisques.constants";

const site = (id: string): Record<string, unknown> => ({
  identifiant_ssp: `SSP${id}`,
  identifiant_casias: `PAL${id}`,
  nom_etablissement: "Garage",
  activite_principale: null,
  adresse: "12 rue de l'Industrie",
  adresse_lieudit: null,
  code_insee: "49020",
  nom_commune: "BEAUCOUZE",
  statut: "En arrêt",
  fiche_risque: `https://fiches-risques.brgm.fr/georisques/casias/SSP${id}`,
  date_maj: "2014-12-04",
  geom: { type: "Point", coordinates: [-0.6071, 47.4745] },
});

describe("CasiasService", () => {
  let service: CasiasService;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGet = vi.fn();
    service = new CasiasService({ get: httpGet } as unknown as HttpService);
  });

  it("interroge /ssp/casias avec le point, le rayon et une courte page", async () => {
    httpGet.mockReturnValue(of({ data: { results: 0, page: 1, total_pages: 0, data: [] } }));

    await service.getCasiasByLatLon({ latitude: 47.4745, longitude: -0.6071, rayon: 250 });

    const [url, options] = httpGet.mock.calls[0] as [
      string,
      { params: Record<string, unknown>; timeout: number },
    ];
    expect(url.endsWith("/ssp/casias")).toBe(true);
    expect(options.params).toMatchObject({ latlon: "-0.6071,47.4745", rayon: 250, page: 1 });
    expect(options.timeout).toBeGreaterThan(0);
  });

  it("applique le rayon seuil par défaut", async () => {
    httpGet.mockReturnValue(of({ data: { results: 0, page: 1, total_pages: 0, data: [] } }));

    const res = await service.getCasiasByLatLon({ latitude: 47.4745, longitude: -0.6071 });

    const [, options] = httpGet.mock.calls[0] as [string, { params: Record<string, unknown> }];
    expect(options.params.rayon).toBe(GEORISQUES_RAYONS_DEFAUT.CASIAS);
    expect(res.data?.rayonMetres).toBe(GEORISQUES_RAYONS_DEFAUT.CASIAS);
  });

  it("compte les sites sur le total de l'API, pas sur la page reçue", async () => {
    httpGet.mockReturnValue(
      of({ data: { results: 87, page: 1, total_pages: 18, data: [site("1"), site("2")] } }),
    );

    const res = await service.getCasiasByLatLon({ latitude: 48.8566, longitude: 2.3522 });

    expect(res.success).toBe(true);
    expect(res.source).toBe(GEORISQUES_SOURCES.CASIAS);
    expect(res.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(res.data?.presenceCasias).toBe(true);
    expect(res.data?.nombreCasias).toBe(87);
    expect(res.data?.casiasProches).toHaveLength(2);
    expect(res.data?.casiasProches[0]).toMatchObject({
      id: "PAL1",
      nom: "Garage",
      statut: "En arrêt",
      commune: "BEAUCOUZE",
    });
  });

  it("répond sans site quand le rayon est vide", async () => {
    httpGet.mockReturnValue(of({ data: { results: 0, page: 1, total_pages: 0, data: [] } }));

    const res = await service.getCasiasByLatLon({ latitude: 47.4745, longitude: -0.6071 });

    expect(res.success).toBe(true);
    expect(res.data?.presenceCasias).toBe(false);
    expect(res.data?.nombreCasias).toBe(0);
    expect(res.data?.casiasProches).toEqual([]);
  });

  it("retourne un échec sans lever d'exception quand l'API tombe", async () => {
    httpGet.mockReturnValue(throwError(() => new Error("timeout of 5000ms exceeded")));

    const res = await service.getCasiasByLatLon({ latitude: 47.4745, longitude: -0.6071 });

    expect(res.success).toBe(false);
    expect(res.error).toBe("timeout of 5000ms exceeded");
    expect(res.source).toBe(GEORISQUES_SOURCES.CASIAS);
    expect(res.data).toBeUndefined();
  });
});
