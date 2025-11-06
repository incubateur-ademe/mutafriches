import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { GeoRisquesEnrichissementService } from "./georisques-enrichissement.service";
import { GeoRisquesOrchestrator } from "./georisques.orchestrator";
import { createMockGeoRisquesOrchestrator } from "../../__test-helpers__/enrichissement.mocks";

describe("GeoRisquesEnrichissementService", () => {
  let service: GeoRisquesEnrichissementService;
  let orchestrator: ReturnType<typeof createMockGeoRisquesOrchestrator>;

  beforeEach(async () => {
    vi.clearAllMocks();

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
    const coordonnees = { latitude: 48.0, longitude: -4.0 };

    it("devrait deleguer a l'orchestrateur", async () => {
      // Arrange
      const orchestrationResult = {
        data: { metadata: { sourcesUtilisees: [], sourcesEchouees: [], fiabilite: 10 } },
        sourcesUtilisees: ["source1", "source2"],
        sourcesEchouees: [],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      await service.enrichir(coordonnees);

      // Assert
      expect(orchestrator.fetchAll).toHaveBeenCalledWith(coordonnees);
    });

    it("devrait retourner le resultat de l'orchestrateur", async () => {
      // Arrange
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
      const result = await service.enrichir(coordonnees);

      // Assert
      expect(result.data).toEqual(orchestrationResult.data);
      expect(result.result.sourcesUtilisees).toEqual(["rga"]);
      expect(result.result.success).toBe(true);
    });

    it("devrait retourner success false si aucune source n'a reussi", async () => {
      // Arrange
      const orchestrationResult = {
        data: undefined,
        sourcesUtilisees: [],
        sourcesEchouees: ["rga", "catnat"],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      const result = await service.enrichir(coordonnees);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesUtilisees).toHaveLength(0);
      expect(result.result.sourcesEchouees).toHaveLength(2);
      expect(result.data).toBeUndefined();
    });

    it("devrait retourner success true si au moins une source a reussi", async () => {
      // Arrange
      const orchestrationResult = {
        data: { metadata: { sourcesUtilisees: ["rga"], sourcesEchouees: [], fiabilite: 5 } },
        sourcesUtilisees: ["rga"],
        sourcesEchouees: ["catnat"],
      };
      orchestrator.fetchAll.mockResolvedValue(orchestrationResult);

      // Act
      const result = await service.enrichir(coordonnees);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toHaveLength(1);
    });
  });
});
