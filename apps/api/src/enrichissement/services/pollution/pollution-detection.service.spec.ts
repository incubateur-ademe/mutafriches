import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { PollutionDetectionService } from "./pollution-detection.service";
import { AdemeSitesPolluesRepository } from "../../repositories/ademe-sites-pollues.repository";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import {
  createMockAdemeSitesPolluesRepository,
  createMockSisService,
  createMockIcpeService,
} from "../../__test-helpers__/enrichissement.mocks";

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

  describe("detecterPollution", () => {
    it("devrait detecter pollution si ADEME positif seul", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0, "29232");

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionAdeme).toBe(true);
      expect(result.pollutionSis).toBe(false);
      expect(result.pollutionIcpe).toBe(false);
      expect(result.sourcesPollution).toContain("ADEME-Sites-Pollues");
    });

    it("devrait detecter pollution si SIS positif seul", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionAdeme).toBe(false);
      expect(result.pollutionSis).toBe(true);
      expect(result.pollutionIcpe).toBe(false);
      expect(result.sourcesPollution).toContain(SourceEnrichissement.GEORISQUES_SIS);
    });

    it("devrait detecter pollution si ICPE a moins de 500m", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionAdeme).toBe(false);
      expect(result.pollutionSis).toBe(false);
      expect(result.pollutionIcpe).toBe(true);
      expect(result.distanceIcpePlusProche).toBe(300);
      expect(result.sourcesPollution).toContain(SourceEnrichissement.GEORISQUES_ICPE);
    });

    it("ne devrait PAS detecter pollution si ICPE a plus de 500m", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(false);
      expect(result.pollutionIcpe).toBe(false);
      expect(result.distanceIcpePlusProche).toBe(600);
    });

    it("devrait detecter pollution si ICPE exactement a 500m", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionIcpe).toBe(true);
    });

    it("devrait detecter pollution si plusieurs sources positives", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionAdeme).toBe(true);
      expect(result.pollutionSis).toBe(true);
      expect(result.pollutionIcpe).toBe(true);
      expect(result.sourcesPollution).toHaveLength(3);
    });

    it("ne devrait PAS detecter pollution si toutes les sources negatives", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(false);
      expect(result.pollutionAdeme).toBe(false);
      expect(result.pollutionSis).toBe(false);
      expect(result.pollutionIcpe).toBe(false);
      expect(result.sourcesPollution).toHaveLength(0);
    });

    it("devrait gerer l'echec d'ADEME et continuer avec les autres sources", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionSis).toBe(true);
      expect(result.sourcesEchouees).toContain("ADEME-Sites-Pollues");
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_SIS);
    });

    it("devrait gerer l'echec de SIS et continuer avec les autres sources", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionAdeme).toBe(true);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(result.sourcesUtilisees).toContain("ADEME-Sites-Pollues");
    });

    it("devrait gerer l'echec de ICPE et continuer avec les autres sources", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(true);
      expect(result.pollutionSis).toBe(true);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
    });

    it("devrait retourner false si toutes les sources echouent", async () => {
      // Arrange
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
      const result = await service.detecterPollution(48.0, -4.0);

      // Assert
      expect(result.siteReferencePollue).toBe(false);
      expect(result.sourcesEchouees).toHaveLength(3);
      expect(result.sourcesUtilisees).toHaveLength(0);
    });

    it("devrait appeler les 3 sources en parallele", async () => {
      // Arrange
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
      await service.detecterPollution(48.0, -4.0);

      // Assert - les 3 appels doivent etre quasi simultanes
      const maxDiff = Math.max(
        Math.abs(ademeCallTime - sisCallTime),
        Math.abs(sisCallTime - icpeCallTime),
        Math.abs(ademeCallTime - icpeCallTime),
      );
      expect(maxDiff).toBeLessThan(5);
    });

    it("devrait passer le code INSEE a ADEME", async () => {
      // Arrange
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
      await service.detecterPollution(48.0, -4.0, "29232");

      // Assert
      expect(ademeRepository.isSiteReferencePollue).toHaveBeenCalledWith(48.0, -4.0, "29232");
    });
  });
});
