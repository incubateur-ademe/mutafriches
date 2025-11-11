import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { TransportEnrichissementService } from "./transport-enrichissement.service";
import { ServicePublicService } from "../../adapters/service-public/service-public.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("TransportEnrichissementService", () => {
  let service: TransportEnrichissementService;
  let servicePublicService: ServicePublicService;

  beforeEach(() => {
    // Mock du ServicePublicService
    servicePublicService = {
      getMairieCoordonnees: vi.fn(),
    } as unknown as ServicePublicService;

    service = new TransportEnrichissementService(servicePublicService);
  });

  describe("enrichir - Centre-ville", () => {
    it("devrait determiner que la parcelle est en centre-ville (< 1000m)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock : mairie à 500m
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test Commune",
          coordonnees: { latitude: 48.0045, longitude: -4.0 }, // ~500m
          adresse: "Mairie, Place de la Mairie 29232 Test Commune",
        },
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(true);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT);
      expect(servicePublicService.getMairieCoordonnees).toHaveBeenCalledWith("29232");
    });

    it("devrait determiner que la parcelle n'est PAS en centre-ville (> 1000m)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock : mairie à 2km
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test Commune",
          coordonnees: { latitude: 48.018, longitude: -4.0 }, // ~2000m
          adresse: "Mairie, Place de la Mairie 29232 Test Commune",
        },
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(false);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
    });

    it("devrait mettre centre-ville a false si erreur API Service Public", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock : erreur API Service Public
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: false,
        error: "Mairie non trouvée",
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(false); // Valeur par défaut
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // Transport temporaire devrait quand même fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT);
    });

    it("devrait determiner centre-ville avec une vraie parcelle (Trélazé)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000ZE0153";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Trélazé";
      parcelle.coordonnees = { latitude: 47.4484, longitude: -0.4768 };

      // Mock : vraie mairie de Trélazé
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "49007",
          nomCommune: "Trélazé",
          coordonnees: { latitude: 47.447, longitude: -0.474 }, // ~200m de la parcelle
          adresse: "Mairie, Place Leclerc 49800 Trélazé",
        },
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(true); // < 1km
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
    });
  });

  describe("enrichir - Transport en commun", () => {
    it("devrait enrichir avec une distance transport (donnees temporaires)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock centre-ville
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test Commune",
          coordonnees: { latitude: 48.0045, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBeDefined();
      expect(parcelle.distanceTransportCommun).toBeGreaterThanOrEqual(100);
      expect(parcelle.distanceTransportCommun).toBeLessThanOrEqual(2000);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT);
    });
  });

  describe("enrichir - Cas d'erreur", () => {
    it("devrait retourner echec si pas de coordonnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = undefined;

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBeUndefined();
      expect(parcelle.siteEnCentreVille).toBeUndefined();
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // Ne doit pas appeler l'API
      expect(servicePublicService.getMairieCoordonnees).not.toHaveBeenCalled();
    });

    it("devrait retourner echec si pas de code INSEE", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = undefined;
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // Ne doit pas appeler l'API
      expect(servicePublicService.getMairieCoordonnees).not.toHaveBeenCalled();
    });
  });

  describe("enrichir - Succès partiel", () => {
    it("devrait continuer meme si centre-ville echoue (transport temporaire fonctionne)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock : erreur API Service Public (timeout)
      vi.mocked(servicePublicService.getMairieCoordonnees).mockRejectedValue(
        new Error("Timeout API"),
      );

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true); // Succès partiel (transport fonctionne)
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(parcelle.siteEnCentreVille).toBe(false); // Valeur par défaut
      expect(parcelle.distanceTransportCommun).toBeDefined();
    });
  });

  describe("isCentreVille - Seuil de 1000m", () => {
    it("devrait retourner true pour 900m", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "TEST";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Test";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Distance ~900m
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Test",
          coordonnees: { latitude: 48.0081, longitude: -4.0 }, // ~900m
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(true);
    });

    it("devrait retourner false pour 1100m", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "TEST";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Test";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Distance ~1100m
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Test",
          coordonnees: { latitude: 48.01, longitude: -4.0 }, // ~1112m
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(false);
    });
  });
});
