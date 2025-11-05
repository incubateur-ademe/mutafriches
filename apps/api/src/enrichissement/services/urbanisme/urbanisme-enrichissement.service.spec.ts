import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { UrbanismeEnrichissementService } from "./urbanisme-enrichissement.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("UrbanismeEnrichissementService", () => {
  let service: UrbanismeEnrichissementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrbanismeEnrichissementService],
    }).compile();

    service = module.get<UrbanismeEnrichissementService>(UrbanismeEnrichissementService);
  });

  describe("enrichir", () => {
    it("devrait enrichir avec toutes les donnees urbanisme (temporaires)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };
      parcelle.commune = "Quimper";

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.proximiteCommercesServices).toBeDefined();
      expect(parcelle.tauxLogementsVacants).toBeDefined();
      expect(parcelle.siteEnCentreVille).toBeDefined();
      expect(parcelle.distanceAutoroute).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("devrait enrichir proximite commerces/services (Overpass temporaire)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };
      parcelle.commune = "Quimper";

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.proximiteCommercesServices).toBeDefined();
      expect(typeof parcelle.proximiteCommercesServices).toBe("boolean");
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS_TEMPORAIRE);
    });

    it("devrait enrichir taux logements vacants (Lovac temporaire)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };
      parcelle.commune = "Quimper";

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.tauxLogementsVacants).toBeDefined();
      expect(parcelle.tauxLogementsVacants).toBeGreaterThanOrEqual(2);
      expect(parcelle.tauxLogementsVacants).toBeLessThanOrEqual(15);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC_TEMPORAIRE);
    });

    it("devrait enrichir centre-ville et autoroute (donnees temporaires)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };
      parcelle.commune = "Quimper";

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBeDefined();
      expect(typeof parcelle.siteEnCentreVille).toBe("boolean");
      expect(parcelle.distanceAutoroute).toBeDefined();
      expect(parcelle.distanceAutoroute).toBeGreaterThanOrEqual(1);
      expect(parcelle.distanceAutoroute).toBeLessThanOrEqual(20);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.DONNEES_TEMPORAIRES);
    });

    it("devrait marquer Overpass comme echec si pas de coordonnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = undefined; // Pas de coordonnées
      parcelle.commune = "Quimper";

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.champsManquants).toContain("proximiteCommercesServices");
    });

    it("devrait marquer Lovac comme echec si pas de commune", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };
      parcelle.commune = undefined; // Pas de commune

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
    });

    it("devrait enrichir partiellement meme si certaines donnees manquent", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = undefined; // Pas de coordonnées
      parcelle.commune = "Quimper";

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true); // Succès partiel
      expect(result.sourcesUtilisees.length).toBeGreaterThan(0);
      expect(result.sourcesEchouees.length).toBeGreaterThan(0);
    });
  });
});
