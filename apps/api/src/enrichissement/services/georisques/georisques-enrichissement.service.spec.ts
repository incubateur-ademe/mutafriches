import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { GeoRisquesEnrichissementService } from "./georisques-enrichissement.service";
import { GeoRisquesOrchestrator } from "./georisques.orchestrator";
import { Site } from "../../../evaluation/entities/site.entity";
import { createMockGeoRisquesOrchestrator } from "../../__test-helpers__/enrichissement.mocks";

/** Crée un site de test avec des coordonnées */
function createTestSite(): Site {
  const site = new Site();
  site.identifiantParcelle = "29232000AB0001";
  site.coordonnees = { latitude: 48.0, longitude: -4.0 };
  return site;
}

describe("GeoRisquesEnrichissementService", () => {
  let service: GeoRisquesEnrichissementService;
  let orchestrator: ReturnType<typeof createMockGeoRisquesOrchestrator>;

  beforeEach(async () => {
    const mockOrchestrator = createMockGeoRisquesOrchestrator();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoRisquesEnrichissementService,
        { provide: GeoRisquesOrchestrator, useValue: mockOrchestrator },
      ],
    }).compile();

    service = module.get<GeoRisquesEnrichissementService>(GeoRisquesEnrichissementService);
    orchestrator = mockOrchestrator;
  });

  describe("enrichir", () => {
    it("devrait déléguer à l'orchestrateur avec les coordonnées du site", async () => {
      // Arrange
      const site = createTestSite();
      const orchestrationResult = {
        data: { metadata: { sourcesUtilisees: [], sourcesEchouees: [], fiabilite: 10 } },
        sourcesUtilisees: ["source1", "source2"],
        sourcesEchouees: [],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      await service.enrichir(site);

      // Assert
      expect(orchestrator.fetchAll).toHaveBeenCalledWith(site.coordonnees);
    });

    it("devrait retourner le résultat de l'orchestrateur", async () => {
      // Arrange
      const site = createTestSite();
      const orchestrationResult = {
        data: {
          rga: { alea: "Fort" },
          metadata: { sourcesUtilisees: ["rga"], sourcesEchouees: [], fiabilite: 10 },
        },
        sourcesUtilisees: ["rga"],
        sourcesEchouees: [],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.data).toEqual(orchestrationResult.data);
      expect(result.result.sourcesUtilisees).toEqual(["rga"]);
      expect(result.result.success).toBe(true);
    });

    it("devrait retourner success false si aucune source n'a réussi", async () => {
      // Arrange
      const site = createTestSite();
      const orchestrationResult = {
        data: undefined,
        sourcesUtilisees: [],
        sourcesEchouees: ["rga", "catnat"],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesUtilisees).toHaveLength(0);
      expect(result.result.sourcesEchouees).toHaveLength(2);
      expect(result.data).toBeUndefined();
    });

    it("devrait retourner success true si au moins une source a réussi", async () => {
      // Arrange
      const site = createTestSite();
      const orchestrationResult = {
        data: { metadata: { sourcesUtilisees: ["rga"], sourcesEchouees: [], fiabilite: 5 } },
        sourcesUtilisees: ["rga"],
        sourcesEchouees: ["catnat"],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toHaveLength(1);
    });

    it("devrait gérer un site sans coordonnées", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0001";
      // Pas de coordonnées

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(orchestrator.fetchAll).not.toHaveBeenCalled();
    });
  });
});
