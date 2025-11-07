import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ZonageReglementaire, SourceEnrichissement } from "@mutafriches/shared-types";
import { ZonageReglementaireService } from "./zonage-reglementaire.service";
import { ZonageReglementaireCalculator } from "./zonage-reglementaire.calculator";
import { ApiCartoGpuService } from "../../../adapters/api-carto/gpu/api-carto-gpu.service";
import { ParcelleGeometry } from "../../shared/geometry.types";

describe("ZonageReglementaireService", () => {
  let service: ZonageReglementaireService;
  let apiCartoGpuService: any;
  let calculator: any;

  const mockGeometry: ParcelleGeometry = {
    type: "Point",
    coordinates: [2.3522, 48.8566],
  };

  const mockCodeInsee = "75056";

  beforeEach(async () => {
    apiCartoGpuService = {
      getZoneUrba: vi.fn(),
      getSecteurCC: vi.fn(),
      getMunicipalityInfo: vi.fn(),
    };

    calculator = {
      evaluer: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonageReglementaireService,
        { provide: ApiCartoGpuService, useValue: apiCartoGpuService },
        { provide: ZonageReglementaireCalculator, useValue: calculator },
      ],
    }).compile();

    service = module.get<ZonageReglementaireService>(ZonageReglementaireService);
  });

  describe("enrichir", () => {
    it("devrait enrichir avec zone PLU U détectée", async () => {
      // Arrange
      const mockFeatures = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typezone: "U",
            libelle: "Zone urbaine",
            destdomi: "Habitat",
          },
        },
      ];

      apiCartoGpuService.getZoneUrba.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: mockFeatures },
      });
      apiCartoGpuService.getSecteurCC.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getMunicipalityInfo.mockResolvedValue({
        success: true,
        data: { insee: "75056", name: "Paris", is_rnu: false },
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.ZONE_URBAINE_U);

      // Act
      const result = await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.API_CARTO_GPU);
      expect(result.evaluation.zoneUrba).toEqual({
        present: true,
        nombreZones: 1,
        typezone: "U",
        libelle: "Zone urbaine",
        destdomi: "Habitat",
      });
      expect(result.evaluation.zonageFinal).toBe(ZonageReglementaire.ZONE_URBAINE_U);
    });

    it("devrait enrichir avec zone PLU AU détectée", async () => {
      // Arrange
      const mockFeatures = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typezone: "AU",
            libelle: "Zone à urbaniser",
          },
        },
      ];

      apiCartoGpuService.getZoneUrba.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: mockFeatures },
      });
      apiCartoGpuService.getSecteurCC.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getMunicipalityInfo.mockResolvedValue({
        success: true,
        data: { insee: "75056", name: "Paris", is_rnu: false },
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.ZONE_A_URBANISER_AU);

      // Act
      const result = await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      expect(result.evaluation.zoneUrba?.typezone).toBe("AU");
      expect(result.evaluation.zonageFinal).toBe(ZonageReglementaire.ZONE_A_URBANISER_AU);
    });

    it("devrait enrichir avec secteur carte communale constructible", async () => {
      // Arrange
      const mockFeatures = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typesect: "constructible",
            libelle: "Secteur constructible",
          },
        },
      ];

      apiCartoGpuService.getZoneUrba.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSecteurCC.mockResolvedValue({
        success: true,
        data: { totalFeatures: 1, features: mockFeatures },
      });
      apiCartoGpuService.getMunicipalityInfo.mockResolvedValue({
        success: true,
        data: { insee: "12345", name: "Petite Commune", is_rnu: false },
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION);

      // Act
      const result = await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      expect(result.evaluation.secteurCC).toEqual({
        present: true,
        nombreSecteurs: 1,
        typesect: "constructible",
        libelle: "Secteur constructible",
      });
      expect(result.evaluation.zonageFinal).toBe(
        ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION,
      );
    });

    it("devrait enrichir avec commune en RNU", async () => {
      // Arrange
      apiCartoGpuService.getZoneUrba.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSecteurCC.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getMunicipalityInfo.mockResolvedValue({
        success: true,
        data: { insee: "12345", name: "Village RNU", is_rnu: true },
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.NE_SAIT_PAS);

      // Act
      const result = await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      expect(result.evaluation.commune).toEqual({
        insee: "12345",
        name: "Village RNU",
        is_rnu: true,
      });
      expect(result.evaluation.zonageFinal).toBe(ZonageReglementaire.NE_SAIT_PAS);
    });

    it("devrait continuer malgré échecs partiels", async () => {
      // Arrange
      apiCartoGpuService.getZoneUrba.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      apiCartoGpuService.getSecteurCC.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getMunicipalityInfo.mockResolvedValue({
        success: true,
        data: { insee: "12345", name: "Commune", is_rnu: false },
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.NE_SAIT_PAS);

      // Act
      const result = await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.evaluation.zoneUrba).toEqual({
        present: false,
        nombreZones: 0,
      });
      expect(result.evaluation.commune).toBeTruthy();
    });

    it("devrait retourner NE_SAIT_PAS si aucune donnée", async () => {
      // Arrange
      apiCartoGpuService.getZoneUrba.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getSecteurCC.mockResolvedValue({
        success: true,
        data: { totalFeatures: 0, features: [] },
      });
      apiCartoGpuService.getMunicipalityInfo.mockResolvedValue({
        success: true,
        data: { insee: "12345", name: "Commune", is_rnu: false },
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.NE_SAIT_PAS);

      // Act
      const result = await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      expect(result.evaluation.zonageFinal).toBe(ZonageReglementaire.NE_SAIT_PAS);
      expect(result.evaluation.zoneUrba).toEqual({
        present: false,
        nombreZones: 0,
      });
      expect(result.evaluation.secteurCC).toEqual({
        present: false,
        nombreSecteurs: 0,
      });
    });

    it("devrait appeler les APIs en parallèle", async () => {
      // Arrange
      const startTimes: Record<string, number> = {};

      apiCartoGpuService.getZoneUrba.mockImplementation(async () => {
        startTimes.zoneUrba = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoGpuService.getSecteurCC.mockImplementation(async () => {
        startTimes.secteurCC = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { totalFeatures: 0, features: [] } };
      });

      apiCartoGpuService.getMunicipalityInfo.mockImplementation(async () => {
        startTimes.commune = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          success: true,
          data: { insee: "12345", name: "Commune", is_rnu: false },
        };
      });

      calculator.evaluer.mockReturnValue(ZonageReglementaire.NE_SAIT_PAS);

      // Act
      await service.enrichir(mockGeometry, mockCodeInsee);

      // Assert
      const times = Object.values(startTimes);
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(10);
    });
  });
});
