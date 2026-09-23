import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { SaturationReseauEnrEnrichissementService } from "./saturation-reseau-enr-enrichissement.service";
import { ZonesContrainteEnrRepository } from "../../repositories/zones-contrainte-enr.repository";
import { createMockZonesContrainteEnrRepository } from "../../__test-helpers__/enrichissement.mocks";
import { Site } from "../../../evaluation/entities/site.entity";

describe("SaturationReseauEnrEnrichissementService", () => {
  let service: SaturationReseauEnrEnrichissementService;
  let repository: ReturnType<typeof createMockZonesContrainteEnrRepository>;

  function siteAvecCoordonnees(): Site {
    const site = new Site();
    site.identifiantParcelle = "49020000AK0118";
    site.coordonnees = { latitude: 47.4735, longitude: -0.6187 };
    return site;
  }

  beforeEach(async () => {
    repository = createMockZonesContrainteEnrRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaturationReseauEnrEnrichissementService,
        { provide: ZonesContrainteEnrRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<SaturationReseauEnrEnrichissementService>(
      SaturationReseauEnrEnrichissementService,
    );
  });

  it("renseigne true en zone saturée", async () => {
    const site = siteAvecCoordonnees();
    repository.findStatutZoneContenant.mockResolvedValue("SATUREE");

    const result = await service.enrichir(site);

    expect(site.saturationReseauEnr).toBe(true);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ZONES_CONTRAINTE_ENR);
    expect(result.champsManquants).toHaveLength(0);
  });

  it.each(["TRES_FAVORABLE", "FAVORABLE", "EN_TENSION"])(
    "renseigne false en zone %s",
    async (statut) => {
      const site = siteAvecCoordonnees();
      repository.findStatutZoneContenant.mockResolvedValue(statut);

      const result = await service.enrichir(site);

      expect(site.saturationReseauEnr).toBe(false);
      expect(result.success).toBe(true);
      expect(result.sourcesEchouees).toHaveLength(0);
    },
  );

  // Hors périmètre Enedis, affirmer « non saturé » serait un faux négatif indétectable
  it.each([
    ["zone d'une régie locale", "ELD"],
    ["aucune zone", null],
    ["référentiel illisible", undefined],
  ])("laisse le champ indéfini : %s", async (_libelle, statut) => {
    const site = siteAvecCoordonnees();
    repository.findStatutZoneContenant.mockResolvedValue(statut);

    const result = await service.enrichir(site);

    expect(site.saturationReseauEnr).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ZONES_CONTRAINTE_ENR);
    expect(result.champsManquants).toContain("saturationReseauEnr");
  });

  it("n'interroge pas le référentiel sans coordonnées", async () => {
    const result = await service.enrichir(new Site());

    expect(repository.findStatutZoneContenant).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.champsManquants).toContain("saturationReseauEnr");
  });
});
