import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ZonagePatrimonial, SourceEnrichissement } from "@mutafriches/shared-types";
import { ZonagePatrimonialService } from "./zonage-patrimonial.service";
import { ZonagePatrimonialCalculator } from "./zonage-patrimonial.calculator";
import { ApiCartoGpuService } from "../../../adapters/api-carto/gpu/api-carto-gpu.service";
import { ParcelleGeometry } from "../../shared/geometry.types";

describe("ZonagePatrimonialService", () => {
  let service: ZonagePatrimonialService;
  let apiCartoGpuService: any;
  let calculator: any;

  const mockGeometry: ParcelleGeometry = {
    type: "Point",
    coordinates: [2.3522, 48.8566],
  };

  beforeEach(async () => {
    apiCartoGpuService = {
      getSupAC1: vi.fn(),
      getSupAC2: vi.fn(),
      getSupAC4: vi.fn(),
    };

    calculator = {
      evaluer: vi.fn(),
      mapAC1Features: vi.fn(),
      mapAC4Features: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonagePatrimonialService,
        { provide: ApiCartoGpuService, useValue: apiCartoGpuService },
        { provide: ZonagePatrimonialCalculator, useValue: calculator },
      ],
    }).compile();

    service = module.get<ZonagePatrimonialService>(ZonagePatrimonialService);
  });

  describe("enrichir", () => {
    it("devrait enrichir avec AC1 monument détecté", async () => {
      // Arrange
      const mockFeatures = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: { typeass: "Monument historique" },
        },
      ];

      apiCartoGpuService.getSupAC1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: mockFeatures },
      });
      apiCartoGpuService.getSupAC2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC4.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.mapAC1Features.mockReturnValue("monument");
      calculator.evaluer.mockReturnValue(ZonagePatrimonial.MONUMENT_HISTORIQUE);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.API_CARTO_GPU);
      expect(result.evaluation.ac1).toEqual({
        present: true,
        nombreZones: 1,
        type: "monument",
      });
      expect(result.evaluation.zonageFinal).toBe(ZonagePatrimonial.MONUMENT_HISTORIQUE);
      expect(calculator.evaluer).toHaveBeenCalled();
    });

    it("devrait enrichir avec AC1 périmètre ABF détecté", async () => {
      // Arrange
      const mockFeatures = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: { typeass: "Périmètre de protection" },
        },
      ];

      apiCartoGpuService.getSupAC1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: mockFeatures },
      });
      apiCartoGpuService.getSupAC2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC4.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.mapAC1Features.mockReturnValue("perimetre");
      calculator.evaluer.mockReturnValue(ZonagePatrimonial.PERIMETRE_ABF);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.ac1).toEqual({
        present: true,
        nombreZones: 1,
        type: "perimetre",
      });
      expect(result.evaluation.zonageFinal).toBe(ZonagePatrimonial.PERIMETRE_ABF);
    });

    it("devrait enrichir avec AC2 site inscrit/classé détecté", async () => {
      // Arrange
      apiCartoGpuService.getSupAC1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: [{}] },
      });
      apiCartoGpuService.getSupAC4.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonagePatrimonial.SITE_INSCRIT_CLASSE);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.ac2).toEqual({
        present: true,
        nombreZones: 1,
      });
      expect(result.evaluation.zonageFinal).toBe(ZonagePatrimonial.SITE_INSCRIT_CLASSE);
    });

    it("devrait enrichir avec AC4 SPR détecté", async () => {
      // Arrange
      const mockFeatures = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: { typeass: "SPR" },
        },
      ];

      apiCartoGpuService.getSupAC1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC4.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: mockFeatures },
      });

      calculator.mapAC4Features.mockReturnValue("spr");
      calculator.evaluer.mockReturnValue(ZonagePatrimonial.SPR);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.ac4).toEqual({
        present: true,
        nombreZones: 1,
        type: "spr",
      });
      expect(result.evaluation.zonageFinal).toBe(ZonagePatrimonial.SPR);
    });

    it("devrait continuer malgré échecs partiels", async () => {
      // Arrange
      apiCartoGpuService.getSupAC1.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      apiCartoGpuService.getSupAC2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: [{}] },
      });
      apiCartoGpuService.getSupAC4.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonagePatrimonial.SITE_INSCRIT_CLASSE);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.API_CARTO_GPU);
      expect(result.evaluation.ac1).toEqual({
        present: false,
        nombreZones: 0,
      });
      expect(result.evaluation.ac2).toEqual({
        present: true,
        nombreZones: 1,
      });
    });

    it("devrait retourner NON_CONCERNE si aucune zone détectée", async () => {
      // Arrange
      apiCartoGpuService.getSupAC1.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC2.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSupAC4.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });

      calculator.evaluer.mockReturnValue(ZonagePatrimonial.NON_CONCERNE);

      // Act
      const result = await service.enrichir(mockGeometry);

      // Assert
      expect(result.evaluation.zonageFinal).toBe(ZonagePatrimonial.NON_CONCERNE);
      expect(result.evaluation.ac1).toEqual({
        present: false,
        nombreZones: 0,
      });
      expect(result.evaluation.ac2).toEqual({
        present: false,
        nombreZones: 0,
      });
      expect(result.evaluation.ac4).toEqual({
        present: false,
        nombreZones: 0,
      });
    });

    it("devrait appeler les 3 SUP en parallèle", async () => {
      // Arrange
      const startTimes: Record<string, number> = {};

      apiCartoGpuService.getSupAC1.mockImplementation(async () => {
        startTimes.ac1 = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoGpuService.getSupAC2.mockImplementation(async () => {
        startTimes.ac2 = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoGpuService.getSupAC4.mockImplementation(async () => {
        startTimes.ac4 = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      calculator.evaluer.mockReturnValue(ZonagePatrimonial.NON_CONCERNE);

      // Act
      await service.enrichir(mockGeometry);

      // Assert
      const times = Object.values(startTimes);
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(10);
    });
  });
});
