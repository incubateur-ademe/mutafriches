import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ZonageEnvironnemental, SourceEnrichissement } from "@mutafriches/shared-types";
import { ZonageEnvironnementalService } from "./zonage-environnemental.service";
import { ZonageEnvironnementalCalculator } from "./zonage-environnemental.calculator";
import { ApiCartoNatureService } from "../../../adapters/api-carto/nature/api-carto-nature.service";
import { ParcelleGeometry } from "../../shared/geometry.types";

describe("ZonageEnvironnementalService", () => {
  let service: ZonageEnvironnementalService;
  let apiCartoNatureService: any;
  let calculator: any;

  const mockGeometry: ParcelleGeometry = {
    type: "Point",
    coordinates: [2.3522, 48.8566],
  };

  beforeEach(async () => {
    apiCartoNatureService = {
      queryNatura2000Habitats: vi.fn(),
      queryNatura2000Oiseaux: vi.fn(),
      queryZnieff1: vi.fn(),
      queryZnieff2: vi.fn(),
      queryParcNaturelRegional: vi.fn(),
      queryReservesNaturelles: vi.fn(),
    };

    calculator = {
      evaluer: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonageEnvironnementalService,
        { provide: ApiCartoNatureService, useValue: apiCartoNatureService },
        { provide: ZonageEnvironnementalCalculator, useValue: calculator },
      ],
    }).compile();

    service = module.get<ZonageEnvironnementalService>(ZonageEnvironnementalService);
  });

  describe("enrichir", () => {
    it("devrait enrichir avec Natura 2000 détecté", async () => {
      // Arrange
      apiCartoNatureService.queryNatura2000Habitats.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: [] },
      });
      apiCartoNatureService.queryNatura2000Oiseaux.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryParcNaturelRegional.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryReservesNaturelles.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonageEnvironnemental.NATURA_2000);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.API_CARTO_NATURE);
      expect(result.evaluation.natura2000).toEqual({
        present: true,
        nombreZones: 1,
      });
      expect(result.evaluation.zonageFinal).toBe(ZonageEnvironnemental.NATURA_2000);
      expect(calculator.evaluer).toHaveBeenCalledWith(
        { present: true, nombreZones: 1 },
        { present: false, type1: false, type2: false, nombreZones: 0 },
        { present: false, type: null },
        { present: false, nombreReserves: 0 },
      );
    });

    it("devrait enrichir avec ZNIEFF type 1 et 2 détectés", async () => {
      // Arrange
      apiCartoNatureService.queryNatura2000Habitats.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryNatura2000Oiseaux.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 2, features: [] },
      });
      apiCartoNatureService.queryZnieff2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: [] },
      });
      apiCartoNatureService.queryParcNaturelRegional.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryReservesNaturelles.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonageEnvironnemental.ZNIEFF_TYPE_1_2);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.znieff).toEqual({
        present: true,
        type1: true,
        type2: true,
        nombreZones: 3,
      });
      expect(result.evaluation.zonageFinal).toBe(ZonageEnvironnemental.ZNIEFF_TYPE_1_2);
    });

    it("devrait enrichir avec PNR détecté", async () => {
      // Arrange
      apiCartoNatureService.queryNatura2000Habitats.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryNatura2000Oiseaux.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryParcNaturelRegional.mockResolvedValue({
        success: true,
        data: {
          totalFeatures: 1,
          features: [{ properties: { nom: "PNR du Morvan" } }],
        },
      });
      apiCartoNatureService.queryReservesNaturelles.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonageEnvironnemental.PARC_NATUREL_REGIONAL);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.parcNaturel).toEqual({
        present: true,
        type: "regional",
        nom: "PNR du Morvan",
      });
      expect(result.evaluation.zonageFinal).toBe(ZonageEnvironnemental.PARC_NATUREL_REGIONAL);
    });

    it("devrait continuer malgré échecs partiels et utiliser données disponibles", async () => {
      // Arrange - Natura 2000 échoue mais ZNIEFF réussit
      apiCartoNatureService.queryNatura2000Habitats.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      apiCartoNatureService.queryNatura2000Oiseaux.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      apiCartoNatureService.queryZnieff1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: [] },
      });
      apiCartoNatureService.queryZnieff2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryParcNaturelRegional.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryReservesNaturelles.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonageEnvironnemental.ZNIEFF_TYPE_1_2);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.API_CARTO_NATURE);
      expect(result.evaluation.natura2000).toEqual({
        present: false,
        nombreZones: 0,
      });
      expect(result.evaluation.znieff).toEqual({
        present: true,
        type1: true,
        type2: false,
        nombreZones: 1,
      });
    });

    it("devrait retourner HORS_ZONE si aucune zone détectée", async () => {
      // Arrange
      apiCartoNatureService.queryNatura2000Habitats.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryNatura2000Oiseaux.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryZnieff2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryParcNaturelRegional.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoNatureService.queryReservesNaturelles.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonageEnvironnemental.HORS_ZONE);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.zonageFinal).toBe(ZonageEnvironnemental.HORS_ZONE);
    });

    it("devrait appeler toutes les APIs en parallèle", async () => {
      // Arrange
      const startTimes: Record<string, number> = {};

      apiCartoNatureService.queryNatura2000Habitats.mockImplementation(async () => {
        startTimes.natura2000Habitats = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoNatureService.queryNatura2000Oiseaux.mockImplementation(async () => {
        startTimes.natura2000Oiseaux = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoNatureService.queryZnieff1.mockImplementation(async () => {
        startTimes.znieff1 = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoNatureService.queryZnieff2.mockImplementation(async () => {
        startTimes.znieff2 = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoNatureService.queryParcNaturelRegional.mockImplementation(async () => {
        startTimes.pnr = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoNatureService.queryReservesNaturelles.mockImplementation(async () => {
        startTimes.reserves = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      calculator.evaluer.mockReturnValue(ZonageEnvironnemental.HORS_ZONE);

      // Act
      await service.enrichir(mockGeometry);

      // Assert - Vérifier que les appels ont commencé quasi simultanément
      const times = Object.values(startTimes);
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(10);
    });
  });
});
