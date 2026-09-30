import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { CadastreEnrichissementService } from "./cadastre-enrichissement.service";
import { CadastreService } from "../../adapters/cadastre/cadastre.service";
import { BdnbService } from "../../adapters/bdnb/bdnb.service";
import {
  createMockCadastreService,
  createMockBdnbService,
  createMockSiteGeometryService,
} from "../../__test-helpers__/enrichissement.mocks";
import { SiteGeometryService } from "../site/site-geometry.service";

describe("CadastreEnrichissementService", () => {
  let service: CadastreEnrichissementService;
  let cadastreService: ReturnType<typeof createMockCadastreService>;
  let bdnbService: ReturnType<typeof createMockBdnbService>;
  let siteGeometryService: ReturnType<typeof createMockSiteGeometryService>;

  beforeEach(async () => {
    const mockCadastre = createMockCadastreService();
    const mockBdnb = createMockBdnbService();
    const mockSiteGeometry = createMockSiteGeometryService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CadastreEnrichissementService,
        { provide: CadastreService, useValue: mockCadastre },
        { provide: BdnbService, useValue: mockBdnb },
        { provide: SiteGeometryService, useValue: mockSiteGeometry },
      ],
    }).compile();

    service = module.get<CadastreEnrichissementService>(CadastreEnrichissementService);
    cadastreService = mockCadastre;
    bdnbService = mockBdnb;
    siteGeometryService = mockSiteGeometry;
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
      expect(result.site).toBeDefined();
      expect(result.site?.identifiantParcelle).toBe(identifiantTest);
      expect(result.site?.codeInsee).toBe("29232");
      expect(result.site?.commune).toBe("Quimper");
      expect(result.site?.surfaceSite).toBe(1000);
      expect(result.site?.coordonnees).toEqual({ latitude: 48.0, longitude: -4.0 });
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
      expect(result.site?.surfaceBati).toBe(500);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.BDNB);
      expect(result.result.sourcesEchouees).toHaveLength(0);
    });

    it("devrait traiter une parcelle non batie (BDNB renvoie 0) comme une donnee valide", async () => {
      // Arrange : parcelle existante mais sans bâtiment (terrain vacant)
      cadastreService.getParcelleInfo.mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantTest,
          codeInsee: "29232",
          commune: "Quimper",
          surface: 1875,
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          geometrie: { type: "Polygon", coordinates: [] } as any,
        },
      });

      bdnbService.getSurfaceBatie.mockResolvedValue({
        success: true,
        data: 0,
      });

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert : 0 m² bâti est une donnée valide, pas un échec
      expect(result.site?.surfaceBati).toBe(0);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.BDNB);
      expect(result.result.sourcesEchouees).not.toContain(SourceEnrichissement.BDNB_SURFACE_BATIE);
      expect(result.result.champsManquants).not.toContain("surfaceBati");
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
      expect(result.site?.surfaceBati).toBeUndefined();
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
      expect(result.site).toBeNull();
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
      expect(result.site).toBeNull();
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
      expect(result.site).not.toBeNull();
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.BDNB_SURFACE_BATIE);
    });
  });

  describe("enrichirMulti", () => {
    // Suit le nombre d'appels en vol pour vérifier la borne de simultanéité.
    function appelDiffere<T>(compteur: { enCours: number; maximum: number }, valeur: T) {
      return async (): Promise<T> => {
        compteur.enCours += 1;
        compteur.maximum = Math.max(compteur.maximum, compteur.enCours);
        await new Promise((resolve) => setTimeout(resolve, 1));
        compteur.enCours -= 1;
        return valeur;
      };
    }

    it("devrait borner à 10 les appels simultanés sur un site de 55 parcelles", async () => {
      const identifiants = Array.from(
        { length: 55 },
        (_, i) => `70310000AS${String(i).padStart(4, "0")}`,
      );
      const cadastre = { enCours: 0, maximum: 0 };
      const bdnb = { enCours: 0, maximum: 0 };

      cadastreService.getParcelleInfo.mockImplementation((id: string) =>
        appelDiffere(cadastre, {
          success: true,
          data: {
            identifiant: id,
            codeInsee: "70310",
            commune: "Luxeuil-les-Bains",
            surface: 100,
            coordonnees: { latitude: 47.8, longitude: 6.4 },
            geometrie: { type: "Polygon", coordinates: [] } as any,
          },
        })(),
      );
      bdnbService.getSurfaceBatie.mockImplementation(() =>
        appelDiffere(bdnb, { success: true, data: 10 })(),
      );
      siteGeometryService.construireSite.mockReturnValue({ identifiantsParcelles: identifiants });

      const result = await service.enrichirMulti(identifiants);

      expect(result.result.success).toBe(true);
      expect(cadastreService.getParcelleInfo).toHaveBeenCalledTimes(55);
      expect(cadastre.maximum).toBeLessThanOrEqual(10);
      expect(bdnb.maximum).toBeLessThanOrEqual(10);
      const parcelles = siteGeometryService.construireSite.mock.calls[0][0] as {
        surfaceBati?: number;
      }[];
      expect(parcelles).toHaveLength(55);
      expect(parcelles.every((p) => p.surfaceBati === 10)).toBe(true);
    });
  });
});
