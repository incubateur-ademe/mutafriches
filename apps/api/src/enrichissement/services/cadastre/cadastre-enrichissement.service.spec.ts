import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { CadastreEnrichissementService } from "./cadastre-enrichissement.service";
import { CadastreService } from "../../adapters/cadastre/cadastre.service";
import { BdnbService } from "../../adapters/bdnb/bdnb.service";
import {
  createMockCadastreService,
  createMockBdnbService,
} from "../../__test-helpers__/enrichissement.mocks";

describe("CadastreEnrichissementService", () => {
  let service: CadastreEnrichissementService;
  let cadastreService: ReturnType<typeof createMockCadastreService>;
  let bdnbService: ReturnType<typeof createMockBdnbService>;

  beforeEach(async () => {
    const mockCadastre = createMockCadastreService();
    const mockBdnb = createMockBdnbService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CadastreEnrichissementService,
        { provide: CadastreService, useValue: mockCadastre },
        { provide: BdnbService, useValue: mockBdnb },
      ],
    }).compile();

    service = module.get<CadastreEnrichissementService>(CadastreEnrichissementService);
    cadastreService = mockCadastre;
    bdnbService = mockBdnb;
  });

  describe("enrichir", () => {
    const identifiantTest = "29232000AB0123";

    it("devrait initialiser la parcelle avec les donnees cadastre", async () => {
      // Arrange
      cadastreService.getParcelleInfo.mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantTest,
          codeInsee: "29232",
          commune: "Quimper",
          surface: 1000,
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          geometrie: { type: "Polygon", coordinates: [] } as any,
        },
      });

      bdnbService.getSurfaceBatie.mockResolvedValue({
        success: true,
        data: 500,
      });

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result.parcelle).toBeDefined();
      expect(result.parcelle?.identifiantParcelle).toBe(identifiantTest);
      expect(result.parcelle?.codeInsee).toBe("29232");
      expect(result.parcelle?.commune).toBe("Quimper");
      expect(result.parcelle?.surfaceSite).toBe(1000);
      expect(result.parcelle?.coordonnees).toEqual({ latitude: 48.0, longitude: -4.0 });
    });

    it("devrait ajouter la surface batie si BDNB reussit", async () => {
      // Arrange
      cadastreService.getParcelleInfo.mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantTest,
          codeInsee: "29232",
          commune: "Quimper",
          surface: 1000,
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          geometrie: { type: "Polygon", coordinates: [] } as any,
        },
      });

      bdnbService.getSurfaceBatie.mockResolvedValue({
        success: true,
        data: 500,
      });

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result.parcelle?.surfaceBati).toBe(500);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.BDNB);
      expect(result.result.sourcesEchouees).toHaveLength(0);
    });

    it("devrait marquer BDNB comme echec si surface batie indisponible", async () => {
      // Arrange
      cadastreService.getParcelleInfo.mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantTest,
          codeInsee: "29232",
          commune: "Quimper",
          surface: 1000,
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          geometrie: { type: "Polygon", coordinates: [] } as any,
        },
      });

      bdnbService.getSurfaceBatie.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result.parcelle?.surfaceBati).toBeUndefined();
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.result.sourcesUtilisees).not.toContain(SourceEnrichissement.BDNB);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.BDNB_SURFACE_BATIE);
      expect(result.result.champsManquants).toContain("surfaceBati");
    });

    it("devrait retourner null et echec si cadastre introuvable", async () => {
      // Arrange
      cadastreService.getParcelleInfo.mockResolvedValue({
        success: false,
        error: "Parcelle introuvable",
      });

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result.parcelle).toBeNull();
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.result.champsManquants).toContain("toutes-donnees-cadastrales");
    });

    it("devrait gerer les erreurs du service cadastre", async () => {
      // Arrange
      cadastreService.getParcelleInfo.mockRejectedValue(new Error("Timeout"));

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result.parcelle).toBeNull();
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.CADASTRE);
    });

    it("devrait gerer les erreurs du service BDNB sans bloquer", async () => {
      // Arrange
      cadastreService.getParcelleInfo.mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantTest,
          codeInsee: "29232",
          commune: "Quimper",
          surface: 1000,
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          geometrie: { type: "Polygon", coordinates: [] } as any,
        },
      });

      bdnbService.getSurfaceBatie.mockRejectedValue(new Error("Service error"));

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert - le cadastre doit avoir reussi
      expect(result.parcelle).not.toBeNull();
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.BDNB_SURFACE_BATIE);
    });
  });
});
