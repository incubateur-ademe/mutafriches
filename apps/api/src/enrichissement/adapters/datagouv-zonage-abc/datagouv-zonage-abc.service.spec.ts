import { describe, it, expect, beforeEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { DatagouvZonageAbcService } from "./datagouv-zonage-abc.service";

describe("DatagouvZonageAbcService", () => {
  let service: DatagouvZonageAbcService;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGet = vi.fn();
    service = new DatagouvZonageAbcService({ get: httpGet } as unknown as HttpService);
  });

  const reponse = (rows: Record<string, unknown>[]) =>
    of({
      data: {
        data: rows,
        meta: { page: 1, page_size: 1, total: rows.length },
        links: { profile: "", swagger: "", next: null, prev: null },
      },
    });

  it("interroge la ressource tabulaire filtrée sur le code INSEE exact", async () => {
    httpGet.mockReturnValue(reponse([]));

    await service.getZonageByCommune("75056");

    const url = httpGet.mock.calls[0][0] as string;
    expect(url).toContain("CODGEO__exact=75056");
    expect(url).toContain("page_size=1");
  });

  it("lit le zonage sur le millésime de septembre 2025", async () => {
    httpGet.mockReturnValue(
      reponse([
        {
          CODGEO: "75056",
          DEP: "75",
          LIBGEO: "Paris",
          "Zonage en vigueur depuis le 5 septembre 2025": "Abis",
          "Reclassement 5 septembre 2025": "Non",
        },
      ]),
    );

    const result = await service.getZonageByCommune("75056");

    expect(result).toEqual({
      codeInsee: "75056",
      commune: "Paris",
      zonage: ZonageAbcLogement.ABIS,
    });
  });

  it("lit le zonage sur le millésime de juin 2026 (colonne renommée)", async () => {
    // Le nom de la colonne porte le millésime : le figer casse l'enrichissement
    // pour toutes les communes à chaque publication du dataset.
    httpGet.mockReturnValue(
      reponse([
        {
          __id: 30178,
          CODGEO: "77288",
          DEP: "77",
          LIBGEO: "Melun",
          "Zonage ABC en vigueur depuis le 26 juin 2026": "A",
        },
      ]),
    );

    const result = await service.getZonageByCommune("77288");

    expect(result).toEqual({ codeInsee: "77288", commune: "Melun", zonage: ZonageAbcLogement.A });
  });

  it("tolère les variantes d'écriture de la zone A bis", async () => {
    httpGet.mockReturnValue(
      reponse([
        {
          CODGEO: "75056",
          DEP: "75",
          LIBGEO: "Paris",
          "Zonage ABC en vigueur depuis le 26 juin 2026": " A bis ",
        },
      ]),
    );

    const result = await service.getZonageByCommune("75056");

    expect(result?.zonage).toBe(ZonageAbcLogement.ABIS);
  });

  it("retourne null quand la commune est absente du référentiel", async () => {
    httpGet.mockReturnValue(reponse([]));

    // null = recherche effectuée sans résultat : le critère compte pour la fiabilité
    await expect(service.getZonageByCommune("88000")).resolves.toBeNull();
  });

  it("retourne undefined quand aucune colonne de zonage n'est reconnue", async () => {
    httpGet.mockReturnValue(
      reponse([{ CODGEO: "75056", DEP: "75", LIBGEO: "Paris", "Colonne inattendue": "Abis" }]),
    );

    await expect(service.getZonageByCommune("75056")).resolves.toBeUndefined();
  });

  it("retourne undefined quand la valeur de zonage est inconnue", async () => {
    httpGet.mockReturnValue(
      reponse([
        {
          CODGEO: "75056",
          DEP: "75",
          LIBGEO: "Paris",
          "Zonage ABC en vigueur depuis le 26 juin 2026": "B3",
        },
      ]),
    );

    await expect(service.getZonageByCommune("75056")).resolves.toBeUndefined();
  });

  it("retourne undefined en cas d'erreur réseau", async () => {
    httpGet.mockReturnValue(throwError(() => new Error("timeout of 10000ms exceeded")));

    await expect(service.getZonageByCommune("75056")).resolves.toBeUndefined();
  });
});
