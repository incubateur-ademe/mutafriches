import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { ZaeEnrichissementService } from "./zae-enrichissement.service";
import { ZaeRepository } from "../../repositories/zae.repository";
import { createMockZaeRepository } from "../../__test-helpers__/enrichissement.mocks";
import { Site } from "../../../evaluation/entities/site.entity";

describe("ZaeEnrichissementService", () => {
  let service: ZaeEnrichissementService;
  let zaeRepository: ReturnType<typeof createMockZaeRepository>;

  function siteAvecCoordonnees(): Site {
    const site = new Site();
    site.identifiantParcelle = "01053000AB0001";
    site.coordonnees = { latitude: 46.21111, longitude: 5.23681 };
    return site;
  }

  beforeEach(async () => {
    zaeRepository = createMockZaeRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ZaeEnrichissementService, { provide: ZaeRepository, useValue: zaeRepository }],
    }).compile();

    service = module.get<ZaeEnrichissementService>(ZaeEnrichissementService);
  });

  it("renseigne true quand le site est dans une zone d'activité", async () => {
    const site = siteAvecCoordonnees();
    zaeRepository.estDansZae.mockResolvedValue(true);

    const result = await service.enrichir(site);

    expect(site.siteEnZae).toBe(true);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ZAE_FUSAC);
    expect(result.champsManquants).toHaveLength(0);
  });

  it("renseigne false quand la recherche aboutit hors de toute zone", async () => {
    // false, pas undefined : la recherche a eu lieu, le critère compte pour la fiabilité
    const site = siteAvecCoordonnees();
    zaeRepository.estDansZae.mockResolvedValue(false);

    const result = await service.enrichir(site);

    expect(site.siteEnZae).toBe(false);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ZAE_FUSAC);
  });

  it("laisse le critère indisponible quand le référentiel ne répond pas", async () => {
    const site = siteAvecCoordonnees();
    zaeRepository.estDansZae.mockResolvedValue(undefined);

    const result = await service.enrichir(site);

    expect(site.siteEnZae).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ZAE_FUSAC);
    expect(result.champsManquants).toContain("siteEnZae");
  });

  it("laisse le critère indisponible outre-mer, sans interroger le référentiel", async () => {
    const site = siteAvecCoordonnees();
    site.codeInsee = "97411";

    const result = await service.enrichir(site);

    expect(site.siteEnZae).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.champsManquants).toContain("siteEnZae");
    expect(zaeRepository.estDansZae).not.toHaveBeenCalled();
  });

  it("n'interroge pas le référentiel sans coordonnées", async () => {
    const site = new Site();

    const result = await service.enrichir(site);

    expect(result.success).toBe(false);
    expect(result.champsManquants).toContain("siteEnZae");
    expect(zaeRepository.estDansZae).not.toHaveBeenCalled();
  });
});
