import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { PollutionDetectionService } from "./pollution-detection.service";
import { Site } from "../../../evaluation/entities/site.entity";
import { AdemeSitesPolluesRepository } from "../../repositories/ademe-sites-pollues.repository";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import {
  createMockAdemeSitesPolluesRepository,
  createMockSisService,
  createMockIcpeService,
} from "../../__test-helpers__/enrichissement.mocks";

/** Crée un site de test avec des coordonnées */
function createTestSite(latitude = 48.0, longitude = -4.0, codeInsee?: string): Site {
  const site = new Site();
  site.identifiantParcelle = "29232000AB0001";
  site.coordonnees = { latitude, longitude };
  if (codeInsee) {
    site.codeInsee = codeInsee;
  }
  return site;
}

describe("PollutionDetectionService", () => {
  let service: PollutionDetectionService;
  let ademeRepository: ReturnType<typeof createMockAdemeSitesPolluesRepository>;
  let sisService: ReturnType<typeof createMockSisService>;
  let icpeService: ReturnType<typeof createMockIcpeService>;

  beforeEach(async () => {
    const mockAdeme = createMockAdemeSitesPolluesRepository();
    const mockSis = createMockSisService();
    const mockIcpe = createMockIcpeService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollutionDetectionService,
        { provide: AdemeSitesPolluesRepository, useValue: mockAdeme },
        { provide: SisService, useValue: mockSis },
        { provide: IcpeService, useValue: mockIcpe },
      ],
    }).compile();

    service = module.get<PollutionDetectionService>(PollutionDetectionService);
    ademeRepository = mockAdeme;
    sisService = mockSis;
    icpeService = mockIcpe;
  });

  describe("enrichir", () => {
    it("devrait détecter pollution si ADEME positif seul", async () => {
      // Arrange
      const site = createTestSite(48.0, -4.0, "29232");
      ademeRepository.isSiteReferencePollue.mockResolvedValue(true);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain("ADEME-Sites-Pollues");
    });

    it("devrait détecter pollution si SIS positif seul", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: true },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_SIS);
    });

    it("devrait détecter pollution si ICPE à moins de 500m", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 1, distancePlusProche: 300 },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
    });

    it("ne devrait PAS détecter pollution si ICPE à plus de 500m", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 1, distancePlusProche: 600 },
      });

      // Act
      await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(false);
    });

    it("devrait détecter pollution si ICPE exactement à 500m", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 1, distancePlusProche: 500 },
      });

      // Act
      await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
    });

    it("devrait détecter pollution si plusieurs sources positives", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(true);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: true },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 1, distancePlusProche: 200 },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.sourcesUtilisees).toHaveLength(3);
    });

    it("ne devrait PAS détecter pollution si toutes les sources négatives", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(false);
      expect(result.sourcesUtilisees).toHaveLength(3);
      expect(result.sourcesEchouees).toHaveLength(0);
    });

    it("devrait gérer l'échec d'ADEME et continuer avec les autres sources", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockRejectedValue(new Error("DB error"));
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: true },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.sourcesEchouees).toContain("ADEME-Sites-Pollues");
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_SIS);
    });

    it("devrait gérer l'échec de SIS et continuer avec les autres sources", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(true);
      sisService.getSisByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(result.sourcesUtilisees).toContain("ADEME-Sites-Pollues");
    });

    it("devrait gérer l'échec de ICPE et continuer avec les autres sources", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: true },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(true);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
    });

    it("devrait retourner false si toutes les sources échouent", async () => {
      // Arrange
      const site = createTestSite();
      ademeRepository.isSiteReferencePollue.mockRejectedValue(new Error("DB error"));
      sisService.getSisByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(false);
      expect(result.sourcesEchouees).toHaveLength(3);
      expect(result.sourcesUtilisees).toHaveLength(0);
      expect(result.success).toBe(false);
    });

    it("devrait appeler les 3 sources en parallèle", async () => {
      // Arrange
      const site = createTestSite();
      let ademeCallTime = 0;
      let sisCallTime = 0;
      let icpeCallTime = 0;

      ademeRepository.isSiteReferencePollue.mockImplementation(async () => {
        ademeCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return false;
      });

      sisService.getSisByLatLon.mockImplementation(async () => {
        sisCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { presenceSis: false } };
      });

      icpeService.getIcpeByLatLon.mockImplementation(async () => {
        icpeCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { nombreIcpe: 0, distancePlusProche: undefined } };
      });

      // Act
      await service.enrichir(site);

      // Assert - les 3 appels doivent être quasi simultanés
      const maxDiff = Math.max(
        Math.abs(ademeCallTime - sisCallTime),
        Math.abs(sisCallTime - icpeCallTime),
        Math.abs(ademeCallTime - icpeCallTime),
      );
      expect(maxDiff).toBeLessThan(5);
    });

    it("devrait passer le code INSEE à ADEME", async () => {
      // Arrange
      const site = createTestSite(48.0, -4.0, "29232");
      ademeRepository.isSiteReferencePollue.mockResolvedValue(false);
      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });
      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      // Act
      await service.enrichir(site);

      // Assert
      expect(ademeRepository.isSiteReferencePollue).toHaveBeenCalledWith(48.0, -4.0, "29232");
    });

    it("devrait gérer un site sans coordonnées", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0001";
      // Pas de coordonnées

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteReferencePollue).toBe(false);
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toHaveLength(3);
    });
  });
});
