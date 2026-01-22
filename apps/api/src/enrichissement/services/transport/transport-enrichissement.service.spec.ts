import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { TransportEnrichissementService } from "./transport-enrichissement.service";
import { ServicePublicService } from "../../adapters/service-public/service-public.service";
import { IgnWfsService } from "../../adapters/ign-wfs/ign-wfs.service";
import { TransportStopsRepository } from "../../repositories/transport-stops.repository";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("TransportEnrichissementService", () => {
  let service: TransportEnrichissementService;
  let servicePublicService: ServicePublicService;
  let ignWfsService: IgnWfsService;
  let transportStopsRepository: TransportStopsRepository;

  beforeEach(() => {
    // Mock du ServicePublicService
    servicePublicService = {
      getMairieCoordonnees: vi.fn(),
    } as unknown as ServicePublicService;

    // Mock du IgnWfsService
    ignWfsService = {
      getDistanceVoieGrandeCirculation: vi.fn(),
    } as unknown as IgnWfsService;

    // Mock du TransportStopsRepository
    transportStopsRepository = {
      findTransportStopProximite: vi.fn(),
    } as unknown as TransportStopsRepository;

    service = new TransportEnrichissementService(
      servicePublicService,
      ignWfsService,
      transportStopsRepository,
    );
  });

  describe("enrichir - Centre-ville", () => {
    it("devrait determiner que la parcelle est en centre-ville (< 1000m)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock mairie
      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test Commune",
          coordonnees: { latitude: 48.0045, longitude: -4.0 },
          adresse: "Mairie, Place de la Mairie 29232 Test Commune",
        },
        source: "API Service Public",
      });

      // Mock autoroute
      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: {
          distanceMetres: 3500,
          nombreTronconsProches: 2,
        },
        source: "IGN WFS",
      });

      // Mock transport
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(450);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(true);
      expect(parcelle.distanceTransportCommun).toBe(450);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(servicePublicService.getMairieCoordonnees).toHaveBeenCalledWith("29232");
    });

    it("devrait determiner que la parcelle n'est PAS en centre-ville (> 1000m)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test Commune",
          coordonnees: { latitude: 48.018, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 1500, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(800);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(false);
      expect(parcelle.distanceTransportCommun).toBe(800);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });

    it("devrait mettre centre-ville a false si erreur API Service Public", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: false,
        error: "Mairie non trouvee",
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 2000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(600);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(false);
      expect(parcelle.distanceTransportCommun).toBe(600);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // IGN WFS et Transport devrait quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });

    it("devrait determiner centre-ville avec une vraie parcelle (Trelaze)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000ZE0153";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Trelaze";
      parcelle.coordonnees = { latitude: 47.4484, longitude: -0.4768 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "49007",
          nomCommune: "Trelaze",
          coordonnees: { latitude: 47.447, longitude: -0.474 },
          adresse: "Mairie, Place Leclerc 49800 Trelaze",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 4200, nombreTronconsProches: 3 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(350);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(true);
      expect(parcelle.distanceTransportCommun).toBe(350);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });
  });

  describe("enrichir - Distance autoroute", () => {
    it("devrait calculer la distance a l'autoroute la plus proche", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test",
          coordonnees: { latitude: 48.0045, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      // Mock : autoroute a 3.5km
      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: {
          distanceMetres: 3500,
          nombreTronconsProches: 2,
        },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(500);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceAutoroute).toBe(3500);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(ignWfsService.getDistanceVoieGrandeCirculation).toHaveBeenCalledWith(
        48.0,
        -4.0,
        15000,
      );
    });

    it("devrait gerer le cas ou aucune autoroute n'est trouvee", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "RURAL123";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Village Isole";
      parcelle.coordonnees = { latitude: 45.0, longitude: 2.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Village",
          coordonnees: { latitude: 45.0, longitude: 2.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      // Mock : aucune voie dans le rayon
      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: false,
        error: "Aucune voie dans un rayon de 10000m",
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(1200);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceAutoroute).toBeUndefined();
      expect(parcelle.distanceTransportCommun).toBe(1200);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.champsManquants).toContain("distanceAutoroute");
      // Les autres enrichissements devraient quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });

    it("devrait enrichir meme sans code INSEE (IGN WFS fonctionne)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "TEST";
      parcelle.codeInsee = undefined; // Pas de code INSEE
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock : IGN WFS fonctionne sans code INSEE
      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 1200, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(750);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceAutoroute).toBe(1200);
      expect(parcelle.distanceTransportCommun).toBe(750);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      // Service Public devrait echouer (pas de code INSEE)
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
    });
  });

  describe("enrichir - Distance transport en commun", () => {
    it("devrait calculer la distance au transport en commun le plus proche", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "75056000AB0001";
      parcelle.codeInsee = "75056";
      parcelle.commune = "Paris";
      parcelle.coordonnees = { latitude: 48.8566, longitude: 2.3522 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "75056",
          nomCommune: "Paris",
          coordonnees: { latitude: 48.8566, longitude: 2.3522 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 500, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      // Mock : arret a 250m
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(250.5);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBe(251); // Arrondi
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(transportStopsRepository.findTransportStopProximite).toHaveBeenCalledWith(
        48.8566,
        2.3522,
        2000,
      );
    });

    it("devrait gerer le cas ou aucun transport n'est trouve dans le rayon", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "RURAL456";
      parcelle.codeInsee = "23456";
      parcelle.commune = "Campagne Profonde";
      parcelle.coordonnees = { latitude: 44.5, longitude: 1.5 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "23456",
          nomCommune: "Campagne",
          coordonnees: { latitude: 44.5, longitude: 1.5 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 8000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      // Mock : aucun arret dans le rayon de 2km
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      // null = "recherche OK, aucun arrêt dans le rayon" (information valide, pas un champ manquant)
      expect(parcelle.distanceTransportCommun).toBeNull();
      // La source est utilisée (la recherche a fonctionné) et le champ n'est PAS manquant
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.sourcesEchouees).not.toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).not.toContain("distanceTransportCommun");
      // Les autres enrichissements devraient quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
    });

    it("devrait gerer les erreurs du repository transport", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "TEST789";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Test";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Test",
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 3000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      // Mock : erreur repository
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockRejectedValue(
        new Error("Database connection error"),
      );

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBeUndefined();
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).toContain("distanceTransportCommun");
      // Les autres enrichissements devraient quand meme fonctionner
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
    });

    it("devrait arrondir la distance au metre pres", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "TEST";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Test";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Test",
          coordonnees: { latitude: 48.0, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 1000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      // Mock : distance avec decimales
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(456.789);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(parcelle.distanceTransportCommun).toBe(457); // Arrondi
      expect(result.success).toBe(true);
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
      expect(parcelle.distanceAutoroute).toBeUndefined();
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      expect(result.champsManquants).toContain("distanceAutoroute");
      expect(result.champsManquants).toContain("distanceTransportCommun");
      // Ne doit pas appeler les APIs
      expect(servicePublicService.getMairieCoordonnees).not.toHaveBeenCalled();
      expect(ignWfsService.getDistanceVoieGrandeCirculation).not.toHaveBeenCalled();
      expect(transportStopsRepository.findTransportStopProximite).not.toHaveBeenCalled();
    });

    it("devrait retourner echec si pas de code INSEE (seulement pour mairie)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = undefined;
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 5000, nombreTronconsProches: 2 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(800);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // IGN WFS et Transport devraient fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(parcelle.distanceAutoroute).toBe(5000);
      expect(parcelle.distanceTransportCommun).toBe(800);
      // Ne doit pas appeler Service Public
      expect(servicePublicService.getMairieCoordonnees).not.toHaveBeenCalled();
    });
  });

  describe("enrichir - Succes partiel", () => {
    it("devrait continuer meme si centre-ville echoue", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockRejectedValue(
        new Error("Timeout API"),
      );

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 3000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(650);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(parcelle.siteEnCentreVille).toBe(false);
      expect(parcelle.distanceAutoroute).toBe(3000);
      expect(parcelle.distanceTransportCommun).toBe(650);
    });

    it("devrait continuer meme si transport echoue", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.codeInsee = "29232";
      parcelle.commune = "Test Commune";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "29232",
          nomCommune: "Test",
          coordonnees: { latitude: 48.0045, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 2500, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      // Mock : aucun arret trouve dans le rayon (pas une erreur, juste pas de resultat)
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      // Transport utilisé (la recherche a fonctionné) et champ renseigné (null = "pas de transport dans le rayon")
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.sourcesEchouees).not.toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).not.toContain("distanceTransportCommun");
      expect(parcelle.siteEnCentreVille).toBe(true);
      expect(parcelle.distanceAutoroute).toBe(2500);
      expect(parcelle.distanceTransportCommun).toBeNull();
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

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Test",
          coordonnees: { latitude: 48.0081, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 1000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(400);

      // Act
      await service.enrichir(parcelle);

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

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: true,
        data: {
          codeInsee: "12345",
          nomCommune: "Test",
          coordonnees: { latitude: 48.01, longitude: -4.0 },
          adresse: "Mairie",
        },
        source: "API Service Public",
      });

      vi.mocked(ignWfsService.getDistanceVoieGrandeCirculation).mockResolvedValue({
        success: true,
        data: { distanceMetres: 1000, nombreTronconsProches: 1 },
        source: "IGN WFS",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(500);

      // Act
      await service.enrichir(parcelle);

      // Assert
      expect(parcelle.siteEnCentreVille).toBe(false);
    });
  });
});
