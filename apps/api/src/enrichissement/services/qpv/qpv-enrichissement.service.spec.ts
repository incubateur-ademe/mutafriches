import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { QpvEnrichissementService } from "./qpv-enrichissement.service";
import { QpvRepository } from "../../repositories/qpv.repository";
import { createMockQpvRepository } from "../../__test-helpers__/enrichissement.mocks";
import { Site } from "../../../evaluation/entities/site.entity";

describe("QpvEnrichissementService", () => {
  let service: QpvEnrichissementService;
  let qpvRepository: ReturnType<typeof createMockQpvRepository>;

  function siteAvecCoordonnees(): Site {
    const site = new Site();
    site.identifiantParcelle = "01053000AB0001";
    site.coordonnees = { latitude: 46.21111, longitude: 5.23681 };
    return site;
  }

  beforeEach(async () => {
    qpvRepository = createMockQpvRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [QpvEnrichissementService, { provide: QpvRepository, useValue: qpvRepository }],
    }).compile();

    service = module.get<QpvEnrichissementService>(QpvEnrichissementService);
  });

  it("renseigne true quand le site est dans un quartier prioritaire", async () => {
    const site = siteAvecCoordonnees();
    qpvRepository.findQuartierContenant.mockResolvedValue({
      codeQpv: "QN00101M",
      nomQpv: "Grande Reyssouze Terre Des Fleurs",
    });

    const result = await service.enrichir(site);

    expect(site.siteEnQpv).toBe(true);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.QPV);
    expect(result.champsManquants).toHaveLength(0);
  });

  it("renseigne false quand la recherche aboutit hors de tout quartier", async () => {
    // false, pas undefined : la recherche a eu lieu, le critère compte pour la fiabilité
    const site = siteAvecCoordonnees();
    qpvRepository.findQuartierContenant.mockResolvedValue(null);

    const result = await service.enrichir(site);

    expect(site.siteEnQpv).toBe(false);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.QPV);
    expect(result.sourcesEchouees).toHaveLength(0);
  });

  it("laisse le champ indéfini quand la donnée est indisponible", async () => {
    const site = siteAvecCoordonnees();
    qpvRepository.findQuartierContenant.mockResolvedValue(undefined);

    const result = await service.enrichir(site);

    expect(site.siteEnQpv).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.QPV);
    expect(result.champsManquants).toContain("siteEnQpv");
  });

  it("n'interroge pas le référentiel sans coordonnées", async () => {
    const site = new Site();

    const result = await service.enrichir(site);

    expect(qpvRepository.findQuartierContenant).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.QPV);
    expect(result.champsManquants).toContain("siteEnQpv");
  });
});
