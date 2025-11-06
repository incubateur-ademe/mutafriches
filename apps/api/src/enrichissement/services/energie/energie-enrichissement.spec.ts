import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { EnergieEnrichissementService } from "./energie-enrichissement.service";
import { EnedisService } from "../../adapters/enedis/enedis.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("EnergieEnrichissementService", () => {
  let service: EnergieEnrichissementService;
  let enedisService: { getDistanceRaccordement: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockEnedisService = {
      getDistanceRaccordement: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergieEnrichissementService,
        { provide: EnedisService, useValue: mockEnedisService },
      ],
    }).compile();

    service = module.get<EnergieEnrichissementService>(EnergieEnrichissementService);
    enedisService = module.get(EnedisService);
  });

  describe("enrichir", () => {
    it("devrait enrichir la distance de raccordement electrique", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      enedisService.getDistanceRaccordement.mockResolvedValue({
        success: true,
        data: { distance: 250 },
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceRaccordementElectrique).toBe(250);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      expect(result.sourcesEchouees).toHaveLength(0);
    });

    it("devrait retourner echec si pas de coordonnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = undefined; // Pas de coordonnées

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceRaccordementElectrique).toBeUndefined();
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      expect(result.champsManquants).toContain("distanceRaccordementElectrique");
    });

    it("devrait marquer comme echec si Enedis echoue", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      enedisService.getDistanceRaccordement.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceRaccordementElectrique).toBeUndefined();
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      expect(result.champsManquants).toContain("distanceRaccordementElectrique");
    });

    it("devrait gerer les erreurs du service Enedis", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      enedisService.getDistanceRaccordement.mockRejectedValue(new Error("Timeout"));

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      expect(result.champsManquants).toContain("distanceRaccordementElectrique");
    });

    it("devrait appeler Enedis avec les bonnes coordonnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.123, longitude: -4.567 };

      enedisService.getDistanceRaccordement.mockResolvedValue({
        success: true,
        data: { distance: 100 },
      });

      // Act
      await service.enrichir(parcelle);

      // Assert
      expect(enedisService.getDistanceRaccordement).toHaveBeenCalledWith(48.123, -4.567);
    });
  });
});
