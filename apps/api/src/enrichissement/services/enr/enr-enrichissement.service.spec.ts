import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { ZaerWfsService } from "../../adapters/zaer-wfs/zaer-wfs.service";
import { ZaerExclusionResult, ZaerWfsResult } from "../../adapters/zaer-wfs/zaer-wfs.types";
import { EnrEnrichissementService } from "./enr-enrichissement.service";

const EXCLUSION_PV = "Interdiction ZAER (loi APER) toutes ENR sauf toiture";
const EXCLUSION_EOLIEN = "Interdiction ZAER (loi APER) éolien uniquement";

describe("EnrEnrichissementService", () => {
  let service: EnrEnrichissementService;
  let findZaerAtPoint: ReturnType<typeof vi.fn>;
  let findExclusionAtPoint: ReturnType<typeof vi.fn>;
  let findZaerIntersectingSite: ReturnType<typeof vi.fn>;
  let findExclusionIntersectingSite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findZaerAtPoint = vi.fn().mockResolvedValue(reponse([]));
    findExclusionAtPoint = vi.fn().mockResolvedValue(reponse([]));
    findZaerIntersectingSite = vi.fn().mockResolvedValue(reponse([]));
    findExclusionIntersectingSite = vi.fn().mockResolvedValue(reponse([]));

    service = new EnrEnrichissementService({
      findZaerAtPoint,
      findZaerIntersectingSite,
      findExclusionAtPoint,
      findExclusionIntersectingSite,
    } as unknown as ZaerWfsService);
  });

  const siteAvecCoordonnees = (): Site => {
    const site = new Site();
    site.coordonnees = { latitude: 47.25, longitude: 6.03 };
    return site;
  };

  function reponse<T>(data: T[]) {
    return { success: true, data, source: SourceEnrichissement.ZAER };
  }

  const zoneAcceleration = (filiere = "SOLAIRE_PV"): ZaerWfsResult => ({
    nom: "Zone communale",
    filiere,
    detailFiliere: null,
  });

  const zoneInterdiction = (zonage: string): ZaerExclusionResult => ({
    code: "FR3600077",
    nomZone: "Moëze-Oléron",
    typeZone: "Réserve naturelle nationale",
    zonage,
  });

  it("interroge les deux couches avec les coordonnées du site", async () => {
    await service.enrichir(siteAvecCoordonnees());

    expect(findZaerAtPoint).toHaveBeenCalledWith(47.25, 6.03);
    expect(findExclusionAtPoint).toHaveBeenCalledWith(47.25, 6.03);
  });

  it("signale une zone d'exclusion quand la couche OFB interdit toutes EnR sauf toiture", async () => {
    findExclusionAtPoint.mockResolvedValue(reponse([zoneInterdiction(EXCLUSION_PV)]));

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneExclusion).toBe(true);
  });

  it("ignore une interdiction qui ne vise que l'éolien", async () => {
    findExclusionAtPoint.mockResolvedValue(reponse([zoneInterdiction(EXCLUSION_EOLIEN)]));

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneExclusion).toBe(false);
  });

  it("signale l'exclusion dès qu'une seule zone la porte", async () => {
    findExclusionAtPoint.mockResolvedValue(
      reponse([zoneInterdiction(EXCLUSION_EOLIEN), zoneInterdiction(EXCLUSION_PV)]),
    );

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneExclusion).toBe(true);
  });

  it("cumule accélération et interdiction : les deux couches sont indépendantes", async () => {
    findZaerAtPoint.mockResolvedValue(reponse([zoneAcceleration("EOLIEN")]));
    findExclusionAtPoint.mockResolvedValue(reponse([zoneInterdiction(EXCLUSION_PV)]));

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneZaer).toBe(true);
    expect(data?.enZoneExclusion).toBe(true);
    expect(data?.nombreZones).toBe(1);
  });

  it("ne signale pas d'exclusion sur une simple zone d'accélération", async () => {
    findZaerAtPoint.mockResolvedValue(reponse([zoneAcceleration("EOLIEN")]));

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneZaer).toBe(true);
    expect(data?.enZoneExclusion).toBe(false);
  });

  it("échoue si la couche d'interdiction est indisponible", async () => {
    findExclusionAtPoint.mockResolvedValue({
      success: false,
      error: "timeout",
      source: SourceEnrichissement.ZAER,
    });

    const { result, data } = await service.enrichir(siteAvecCoordonnees());

    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ZAER);
    expect(result.champsManquants).toContain("zaer");
    expect(data).toBeUndefined();
  });

  it("utilise la géométrie quand elle est disponible", async () => {
    const site = siteAvecCoordonnees();
    site.geometrie = { type: "Polygon", coordinates: [] };

    await service.enrichir(site);

    expect(findZaerIntersectingSite).toHaveBeenCalledWith(site.geometrie);
    expect(findExclusionIntersectingSite).toHaveBeenCalledWith(site.geometrie);
    expect(findZaerAtPoint).not.toHaveBeenCalled();
  });
});
