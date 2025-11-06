import { describe, it, expect, beforeEach } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { TransportEnrichissementService } from "./transport-enrichissement.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("TransportEnrichissementService", () => {
  let service: TransportEnrichissementService;

  beforeEach(() => {
    service = new TransportEnrichissementService();
  });

  describe("enrichir", () => {
    it("devrait enrichir avec une distance transport (donnees temporaires)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBeDefined();
      expect(parcelle.distanceTransportCommun).toBeGreaterThanOrEqual(100);
      expect(parcelle.distanceTransportCommun).toBeLessThanOrEqual(2000);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT);
    });

    it("devrait retourner echec si pas de coordonnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = undefined;

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBeUndefined();
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.TRANSPORT);
      expect(result.champsManquants).toContain("distanceTransportCommun");
    });

    it("devrait utiliser les donnees temporaires (mock) pour le moment", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT);
      // Note: Une fois le vrai service implémenté, ce test devra être adapté
    });
  });
});
