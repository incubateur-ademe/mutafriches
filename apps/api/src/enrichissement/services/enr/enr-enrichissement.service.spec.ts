import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { ZaerWfsService } from "../../adapters/zaer-wfs/zaer-wfs.service";
import { ZaerWfsResult } from "../../adapters/zaer-wfs/zaer-wfs.types";
import { EnrEnrichissementService } from "./enr-enrichissement.service";

describe("EnrEnrichissementService", () => {
  let service: EnrEnrichissementService;
  let findZaerAtPoint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findZaerAtPoint = vi.fn();
    service = new EnrEnrichissementService({
      findZaerAtPoint,
      findZaerIntersectingSite: vi.fn(),
    } as unknown as ZaerWfsService);
  });

  const siteAvecCoordonnees = (): Site => {
    const site = new Site();
    site.coordonnees = { latitude: 47.25, longitude: 6.03 };
    return site;
  };

  const reponse = (zones: ZaerWfsResult[]) => ({
    success: true,
    data: zones,
    source: SourceEnrichissement.ZAER,
  });

  it("signale une zone d'exclusion quand le zonage porte une interdiction APER", async () => {
    findZaerAtPoint.mockResolvedValue(
      reponse([
        {
          nom: "Zone communale",
          filiere: "SOLAIRE_PV",
          detailFiliere: null,
          zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
        },
      ]),
    );

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneExclusion).toBe(true);
    expect(data?.zones[0].zonage).toBe("Interdiction ZAER (loi APER) toutes ENR sauf toiture");
  });

  it("ne signale pas d'exclusion sur une zone d'accélération", async () => {
    findZaerAtPoint.mockResolvedValue(
      reponse([
        {
          nom: "Zone éolien",
          filiere: "EOLIEN",
          detailFiliere: null,
          zonage: "Zone d'accélération",
        },
      ]),
    );

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneZaer).toBe(true);
    expect(data?.enZoneExclusion).toBe(false);
  });

  it("signale l'exclusion dès qu'une seule zone la porte", async () => {
    findZaerAtPoint.mockResolvedValue(
      reponse([
        {
          nom: "Zone éolien",
          filiere: "EOLIEN",
          detailFiliere: null,
          zonage: "Zone d'accélération",
        },
        {
          nom: "Zone interdite",
          filiere: "SOLAIRE_PV",
          detailFiliere: null,
          zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
        },
      ]),
    );

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneExclusion).toBe(true);
  });

  it("reste à false quand le zonage est absent (repli WFS)", async () => {
    findZaerAtPoint.mockResolvedValue(
      reponse([{ nom: null, filiere: "EOLIEN", detailFiliere: null, zonage: null }]),
    );

    const { data } = await service.enrichir(siteAvecCoordonnees());

    expect(data?.enZoneExclusion).toBe(false);
  });
});
