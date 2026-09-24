import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { TransportEnrichissementService } from "./transport-enrichissement.service";
import { ServicePublicService } from "../../adapters/service-public/service-public.service";
import { AccesAutoroutierService } from "./acces-autoroutier.service";
import { TransportStopsRepository } from "../../repositories/transport-stops.repository";
import { Site } from "../../../evaluation/entities/site.entity";

describe("TransportEnrichissementService", () => {
  let service: TransportEnrichissementService;
  let servicePublicService: ServicePublicService;
  let accesAutoroutierService: AccesAutoroutierService;
  let transportStopsRepository: TransportStopsRepository;

  beforeEach(() => {
    // Mock du ServicePublicService
    servicePublicService = {
      getMairieCoordonnees: vi.fn(),
    } as unknown as ServicePublicService;

    accesAutoroutierService = {
      calculerDistance: vi.fn(),
    } as unknown as AccesAutoroutierService;

    // Mock du TransportStopsRepository
    transportStopsRepository = {
      findTransportStopProximite: vi.fn(),
    } as unknown as TransportStopsRepository;

    service = new TransportEnrichissementService(
      servicePublicService,
      accesAutoroutierService,
      transportStopsRepository,
    );
  });

  describe("enrichir - Centre-ville", () => {
    it("devrait determiner que le site est en centre-ville (< 1000m)", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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
      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 3500,
        parLaRoute: true,
      });

      // Mock transport
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(450);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteEnCentreVille).toBe(true);
      expect(site.distanceTransportCommun).toBe(450);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(servicePublicService.getMairieCoordonnees).toHaveBeenCalledWith("29232");
    });

    it("devrait determiner que le site n'est PAS en centre-ville (> 1000m)", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 1500,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(800);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteEnCentreVille).toBe(false);
      expect(site.distanceTransportCommun).toBe(800);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });

    it("devrait mettre centre-ville a false si erreur API Service Public", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockResolvedValue({
        success: false,
        error: "Mairie non trouvee",
        source: "API Service Public",
      });

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 2000,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(600);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteEnCentreVille).toBe(false);
      expect(site.distanceTransportCommun).toBe(600);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // IGN WFS et Transport devrait quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });

    it("devrait determiner centre-ville avec un vrai site (Trelaze)", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000ZE0153";
      site.codeInsee = "49007";
      site.commune = "Trelaze";
      site.coordonnees = { latitude: 47.4484, longitude: -0.4768 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 4200,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(350);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.siteEnCentreVille).toBe(true);
      expect(site.distanceTransportCommun).toBe(350);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });
  });

  describe("enrichir - Distance autoroute", () => {
    it("devrait calculer la distance a l'autoroute la plus proche", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 3500,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(500);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceAutoroute).toBe(3500);
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(accesAutoroutierService.calculerDistance).toHaveBeenCalledWith({
        latitude: 48.0,
        longitude: -4.0,
      });
    });

    it("devrait gerer une erreur de la recherche d'accès autoroutier", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "RURAL123";
      site.codeInsee = "12345";
      site.commune = "Village Isole";
      site.coordonnees = { latitude: 45.0, longitude: 2.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "erreur",
        message: "WFS indisponible",
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(1200);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceAutoroute).toBeUndefined();
      expect(site.distanceTransportCommun).toBe(1200);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.champsManquants).toContain("distanceAutoroute");
      // Les autres enrichissements devraient quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
    });

    it("devrait mettre null quand aucun accès autoroutier n'est dans le rayon", async () => {
      const site = new Site();
      site.identifiantParcelle = "RURAL123";
      site.coordonnees = { latitude: 45.0, longitude: 2.0 };
      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({ statut: "aucun" });
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      const result = await service.enrichir(site);

      // null = recherche aboutie sans résultat, pas une source en échec
      expect(site.distanceAutoroute).toBeNull();
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.champsManquants).not.toContain("distanceAutoroute");
    });

    it("devrait signaler l'itinéraire utilisé quand la distance est calculée par la route", async () => {
      const site = new Site();
      site.identifiantParcelle = "TEST";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };
      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 2233.6,
        parLaRoute: true,
      });
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      const result = await service.enrichir(site);

      expect(site.distanceAutoroute).toBe(2234);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_ITINERAIRE);
    });

    it("devrait signaler l'itinéraire en échec lors du repli à vol d'oiseau", async () => {
      const site = new Site();
      site.identifiantParcelle = "TEST";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };
      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 1800,
        parLaRoute: false,
      });
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      const result = await service.enrichir(site);

      expect(site.distanceAutoroute).toBe(1800);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.IGN_ITINERAIRE);
      expect(result.champsManquants).not.toContain("distanceAutoroute");
    });

    it("devrait enrichir meme sans code INSEE (IGN WFS fonctionne)", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "TEST";
      site.codeInsee = undefined; // Pas de code INSEE
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

      // Mock : IGN WFS fonctionne sans code INSEE
      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 1200,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(750);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceAutoroute).toBe(1200);
      expect(site.distanceTransportCommun).toBe(750);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      // Service Public devrait echouer (pas de code INSEE)
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
    });
  });

  describe("enrichir - Distance transport en commun", () => {
    it("devrait calculer la distance au transport en commun le plus proche", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "75056000AB0001";
      site.codeInsee = "75056";
      site.commune = "Paris";
      site.coordonnees = { latitude: 48.8566, longitude: 2.3522 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 500,
        parLaRoute: true,
      });

      // Mock : arret a 250m
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(250.5);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceTransportCommun).toBe(251); // Arrondi
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
      const site = new Site();
      site.identifiantParcelle = "RURAL456";
      site.codeInsee = "23456";
      site.commune = "Campagne Profonde";
      site.coordonnees = { latitude: 44.5, longitude: 1.5 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 8000,
        parLaRoute: true,
      });

      // Mock : aucun arret dans le rayon de 2km
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      // Act
      const result = await service.enrichir(site);

      // Assert
      // null = "recherche OK, aucun arrêt dans le rayon" (information valide, pas un champ manquant)
      expect(site.distanceTransportCommun).toBeNull();
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
      const site = new Site();
      site.identifiantParcelle = "TEST789";
      site.codeInsee = "12345";
      site.commune = "Test";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 3000,
        parLaRoute: true,
      });

      // Mock : erreur repository
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockRejectedValue(
        new Error("Database connection error"),
      );

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceTransportCommun).toBeUndefined();
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).toContain("distanceTransportCommun");
      // Les autres enrichissements devraient quand meme fonctionner
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
    });

    it("devrait arrondir la distance au metre pres", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "TEST";
      site.codeInsee = "12345";
      site.commune = "Test";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 1000,
        parLaRoute: true,
      });

      // Mock : distance avec decimales
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(456.789);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceTransportCommun).toBe(457); // Arrondi
      expect(result.success).toBe(true);
    });
  });

  describe("enrichir - Cas d'erreur", () => {
    it("devrait retourner echec si pas de coordonnees", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = undefined;

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(site.distanceTransportCommun).toBeUndefined();
      expect(site.siteEnCentreVille).toBeUndefined();
      expect(site.distanceAutoroute).toBeUndefined();
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      expect(result.champsManquants).toContain("distanceAutoroute");
      expect(result.champsManquants).toContain("distanceTransportCommun");
      // Ne doit pas appeler les APIs
      expect(servicePublicService.getMairieCoordonnees).not.toHaveBeenCalled();
      expect(accesAutoroutierService.calculerDistance).not.toHaveBeenCalled();
      expect(transportStopsRepository.findTransportStopProximite).not.toHaveBeenCalled();
    });

    it("devrait retourner echec si pas de code INSEE (seulement pour mairie)", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = undefined;
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 5000,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(800);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.champsManquants).toContain("siteEnCentreVille");
      // IGN WFS et Transport devraient fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(site.distanceAutoroute).toBe(5000);
      expect(site.distanceTransportCommun).toBe(800);
      // Ne doit pas appeler Service Public
      expect(servicePublicService.getMairieCoordonnees).not.toHaveBeenCalled();
    });
  });

  describe("enrichir - Succes partiel", () => {
    it("devrait continuer meme si centre-ville echoue", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

      vi.mocked(servicePublicService.getMairieCoordonnees).mockRejectedValue(
        new Error("Timeout API"),
      );

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 3000,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(650);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(site.siteEnCentreVille).toBe(false);
      expect(site.distanceAutoroute).toBe(3000);
      expect(site.distanceTransportCommun).toBe(650);
    });

    it("devrait continuer meme si transport echoue", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.codeInsee = "29232";
      site.commune = "Test Commune";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 2500,
        parLaRoute: true,
      });

      // Mock : aucun arret trouve dans le rayon (pas une erreur, juste pas de resultat)
      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(null);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.SERVICE_PUBLIC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.IGN_WFS);
      // Transport utilisé (la recherche a fonctionné) et champ renseigné (null = "pas de transport dans le rayon")
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.sourcesEchouees).not.toContain(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      expect(result.champsManquants).not.toContain("distanceTransportCommun");
      expect(site.siteEnCentreVille).toBe(true);
      expect(site.distanceAutoroute).toBe(2500);
      expect(site.distanceTransportCommun).toBeNull();
    });
  });

  describe("isCentreVille - Seuil de 1000m", () => {
    it("devrait retourner true pour 900m", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "TEST";
      site.codeInsee = "12345";
      site.commune = "Test";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 1000,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(400);

      // Act
      await service.enrichir(site);

      // Assert
      expect(site.siteEnCentreVille).toBe(true);
    });

    it("devrait retourner false pour 1100m", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "TEST";
      site.codeInsee = "12345";
      site.commune = "Test";
      site.coordonnees = { latitude: 48.0, longitude: -4.0 };

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

      vi.mocked(accesAutoroutierService.calculerDistance).mockResolvedValue({
        statut: "trouve",
        distanceMetres: 1000,
        parLaRoute: true,
      });

      vi.mocked(transportStopsRepository.findTransportStopProximite).mockResolvedValue(500);

      // Act
      await service.enrichir(site);

      // Assert
      expect(site.siteEnCentreVille).toBe(false);
    });
  });
});
