import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  StatutEnrichissement,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";
import { EnrichissementService } from "./enrichissement.service";
import { CadastreEnrichissementService } from "./cadastre/cadastre-enrichissement.service";
import { EnergieEnrichissementService } from "./energie/energie-enrichissement.service";
import { TransportEnrichissementService } from "./transport/transport-enrichissement.service";
import { UrbanismeEnrichissementService } from "./urbanisme/urbanisme-enrichissement.service";
import { RisquesNaturelsEnrichissementService } from "./risques-naturels/risques-naturels-enrichissement.service";
import { RisquesTechnologiquesEnrichissementService } from "./risques-technologiques/risques-technologiques-enrichissement.service";
import { GeoRisquesEnrichissementService } from "./georisques/georisques-enrichissement.service";
import { EnrichissementRepository } from "../repositories/enrichissement.repository";
import { PollutionDetectionService } from "./pollution/pollution-detection.service";
import { EnrEnrichissementService } from "./enr/enr-enrichissement.service";
import { EnrCalculator } from "./enr/enr.calculator";
import { Site } from "../../evaluation/entities/site.entity";
import {
  createMockCadastreEnrichissementService,
  createMockEnergieEnrichissementService,
  createMockTransportEnrichissementService,
  createMockUrbanismeEnrichissementService,
  createMockRisquesNaturelsEnrichissementService,
  createMockRisquesTechnologiquesEnrichissementService,
  createMockGeoRisquesEnrichissementService,
  createMockEnrichissementRepository,
  createMockZonageOrchestratorService,
  createMockPollutionDetectionService,
  createMockEnrEnrichissementService,
  createMockEnrCalculator,
  createMockSiteRepository,
} from "../__test-helpers__/enrichissement.mocks";
import { ZonageOrchestratorService } from "./zonage";
import { SiteRepository } from "../repositories/site.repository";

describe("EnrichissementService", () => {
  let service: EnrichissementService;
  let cadastreEnrichissement: ReturnType<typeof createMockCadastreEnrichissementService>;
  let energieEnrichissement: ReturnType<typeof createMockEnergieEnrichissementService>;
  let transportEnrichissement: ReturnType<typeof createMockTransportEnrichissementService>;
  let urbanismeEnrichissement: ReturnType<typeof createMockUrbanismeEnrichissementService>;
  let risquesNaturelsEnrichissement: ReturnType<
    typeof createMockRisquesNaturelsEnrichissementService
  >;
  let risquesTechnologiquesEnrichissement: ReturnType<
    typeof createMockRisquesTechnologiquesEnrichissementService
  >;
  let georisquesEnrichissement: ReturnType<typeof createMockGeoRisquesEnrichissementService>;
  let zonageOrchestrator: ReturnType<typeof createMockZonageOrchestratorService>;
  let pollutionDetection: ReturnType<typeof createMockPollutionDetectionService>;
  let enrichissementRepository: ReturnType<typeof createMockEnrichissementRepository>;

  beforeEach(async () => {
    const mockCadastre = createMockCadastreEnrichissementService();
    const mockEnergie = createMockEnergieEnrichissementService();
    const mockTransport = createMockTransportEnrichissementService();
    const mockUrbanisme = createMockUrbanismeEnrichissementService();
    const mockRisquesNaturels = createMockRisquesNaturelsEnrichissementService();
    const mockRisquesTechnologiques = createMockRisquesTechnologiquesEnrichissementService();
    const mockGeoRisques = createMockGeoRisquesEnrichissementService();
    const mockZonageOrchestrator = createMockZonageOrchestratorService();
    const mockEnrEnrichissement = createMockEnrEnrichissementService();
    const mockEnrCalculator = createMockEnrCalculator();
    const mockPollutionDetection = createMockPollutionDetectionService();
    const mockRepository = createMockEnrichissementRepository();
    const mockSiteRepository = createMockSiteRepository();

    // Configuration par défaut du mock ENR
    mockEnrEnrichissement.enrichir.mockResolvedValue({
      result: { success: true, sourcesUtilisees: ["ZAER-ENR"], sourcesEchouees: [] },
      data: undefined,
    });

    // Configuration par defaut du mock pollution
    mockPollutionDetection.detecterPollution.mockResolvedValue({
      siteReferencePollue: false,
      sourcesPollution: [],
      sourcesUtilisees: ["ADEME-Sites-Pollues"],
      sourcesEchouees: [],
      pollutionAdeme: false,
      pollutionSis: false,
      pollutionIcpe: false,
    });

    // Configuration par defaut du mock cache (pas de cache)
    mockRepository.findValidCache.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichissementService,
        { provide: CadastreEnrichissementService, useValue: mockCadastre },
        { provide: EnergieEnrichissementService, useValue: mockEnergie },
        { provide: TransportEnrichissementService, useValue: mockTransport },
        { provide: UrbanismeEnrichissementService, useValue: mockUrbanisme },
        { provide: RisquesNaturelsEnrichissementService, useValue: mockRisquesNaturels },
        {
          provide: RisquesTechnologiquesEnrichissementService,
          useValue: mockRisquesTechnologiques,
        },
        { provide: GeoRisquesEnrichissementService, useValue: mockGeoRisques },
        { provide: ZonageOrchestratorService, useValue: mockZonageOrchestrator },
        { provide: PollutionDetectionService, useValue: mockPollutionDetection },
        { provide: EnrEnrichissementService, useValue: mockEnrEnrichissement },
        { provide: EnrCalculator, useValue: mockEnrCalculator },
        { provide: EnrichissementRepository, useValue: mockRepository },
        { provide: SiteRepository, useValue: mockSiteRepository },
      ],
    }).compile();

    service = module.get<EnrichissementService>(EnrichissementService);
    cadastreEnrichissement = mockCadastre;
    energieEnrichissement = mockEnergie;
    transportEnrichissement = mockTransport;
    urbanismeEnrichissement = mockUrbanisme;
    risquesNaturelsEnrichissement = mockRisquesNaturels;
    risquesTechnologiquesEnrichissement = mockRisquesTechnologiques;
    georisquesEnrichissement = mockGeoRisques;
    zonageOrchestrator = mockZonageOrchestrator;
    pollutionDetection = mockPollutionDetection;
    enrichissementRepository = mockRepository;
  });

  describe("enrichir", () => {
    const identifiantTest = "29232000AB0123";

    it("devrait orchestrer tous les sous-domaines dans l'ordre", async () => {
      // Arrange
      const site = createMockSite();
      cadastreEnrichissement.enrichir.mockResolvedValue({
        site,
        result: { success: true, sourcesUtilisees: ["cadastre"], sourcesEchouees: [] },
      });
      energieEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["enedis"],
        sourcesEchouees: [],
      });
      transportEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["transport"],
        sourcesEchouees: [],
      });
      urbanismeEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["overpass"],
        sourcesEchouees: [],
      });
      risquesNaturelsEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["rga"], sourcesEchouees: [] },
        evaluation: {
          rga: null,
          cavites: null,
          inondation: null,
          risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.AUCUN,
          risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
          risqueInondation: RisqueInondation.NON,
        },
      });
      risquesTechnologiquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["sis"], sourcesEchouees: [] },
        evaluation: { sis: null, icpe: null, risqueFinal: false },
      });
      georisquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["georisques"], sourcesEchouees: [] },
        data: undefined,
      });
      zonageOrchestrator.enrichirZonages.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["API_CARTO_GPU"], sourcesEchouees: [] },
        zonageEnvironnemental: "hors-zone",
        zonagePatrimonial: "non-concerne",
        zonageReglementaire: "zone-urbaine-u",
        evaluations: { environnemental: null, patrimonial: null, reglementaire: null },
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(cadastreEnrichissement.enrichir).toHaveBeenCalledWith(identifiantTest);
      expect(energieEnrichissement.enrichir).toHaveBeenCalledWith(site);
      expect(transportEnrichissement.enrichir).toHaveBeenCalledWith(site);
      expect(urbanismeEnrichissement.enrichir).toHaveBeenCalledWith(site);
      expect(risquesNaturelsEnrichissement.enrichir).toHaveBeenCalledWith(site);
      expect(risquesTechnologiquesEnrichissement.enrichir).toHaveBeenCalledWith(site);
      expect(georisquesEnrichissement.enrichir).toHaveBeenCalled();
    });

    it("devrait construire le DTO de sortie complet", async () => {
      // Arrange
      const site = createMockSite();
      cadastreEnrichissement.enrichir.mockResolvedValue({
        site,
        result: { success: true, sourcesUtilisees: ["cadastre"], sourcesEchouees: [] },
      });
      energieEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["enedis"],
        sourcesEchouees: [],
      });
      transportEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["transport"],
        sourcesEchouees: [],
      });
      urbanismeEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["overpass"],
        sourcesEchouees: [],
      });
      risquesNaturelsEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["rga"], sourcesEchouees: [] },
        evaluation: {
          rga: null,
          cavites: null,
          inondation: null,
          risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.AUCUN,
          risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
          risqueInondation: RisqueInondation.NON,
        },
      });
      risquesTechnologiquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["sis"], sourcesEchouees: [] },
        evaluation: { sis: null, icpe: null, risqueFinal: false },
      });
      georisquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["georisques"], sourcesEchouees: [] },
        data: { metadata: { sourcesUtilisees: [], sourcesEchouees: [] } },
      });
      zonageOrchestrator.enrichirZonages.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["API_CARTO_GPU"], sourcesEchouees: [] },
        zonageEnvironnemental: "hors-zone",
        zonagePatrimonial: "non-concerne",
        zonageReglementaire: "zone-urbaine-u",
        evaluations: { environnemental: null, patrimonial: null, reglementaire: null },
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result.identifiantParcelle).toBe(identifiantTest);
      expect(result.codeInsee).toBe("29232");
      expect(result.commune).toBe("Quimper");
      expect(result.surfaceSite).toBe(1000);
      expect(result.sourcesUtilisees).toHaveLength(10);
    });

    it("devrait persister l'enrichissement avec statut SUCCES", async () => {
      // Arrange
      const site = createMockSite();
      setupAllMocksSuccess(site, {
        cadastreEnrichissement,
        energieEnrichissement,
        transportEnrichissement,
        urbanismeEnrichissement,
        risquesNaturelsEnrichissement,
        risquesTechnologiquesEnrichissement,
        georisquesEnrichissement,
        zonageOrchestrator,
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(enrichissementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          identifiantCadastral: identifiantTest,
          statut: StatutEnrichissement.SUCCES,
          codeInsee: "29232",
          commune: "Quimper",
        }),
      );
    });

    it("devrait retourner statut PARTIEL si certains services echouent", async () => {
      // Arrange
      const site = createMockSite();
      cadastreEnrichissement.enrichir.mockResolvedValue({
        site,
        result: { success: true, sourcesUtilisees: ["cadastre"], sourcesEchouees: [] },
      });
      energieEnrichissement.enrichir.mockResolvedValue({
        success: false,
        sourcesUtilisees: [],
        sourcesEchouees: ["enedis"],
      });
      transportEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["transport"],
        sourcesEchouees: [],
      });
      urbanismeEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: ["overpass"],
        sourcesEchouees: [],
      });
      risquesNaturelsEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["rga"], sourcesEchouees: [] },
        evaluation: {
          rga: null,
          cavites: null,
          inondation: null,
          risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.AUCUN,
          risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
          risqueInondation: RisqueInondation.NON,
        },
      });
      risquesTechnologiquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["sis"], sourcesEchouees: [] },
        evaluation: { sis: null, icpe: null, risqueFinal: false },
      });
      georisquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["georisques"], sourcesEchouees: [] },
        data: undefined,
      });
      zonageOrchestrator.enrichirZonages.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["API_CARTO_GPU"], sourcesEchouees: [] },
        zonageEnvironnemental: "hors-zone",
        zonagePatrimonial: "non-concerne",
        zonageReglementaire: "zone-urbaine-u",
        evaluations: { environnemental: null, patrimonial: null, reglementaire: null },
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(enrichissementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: StatutEnrichissement.PARTIEL,
        }),
      );
    });

    it("devrait lancer une erreur si cadastre echoue", async () => {
      // Arrange
      cadastreEnrichissement.enrichir.mockResolvedValue({
        site: null,
        result: { success: false, sourcesUtilisees: [], sourcesEchouees: ["cadastre"] },
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act & Assert
      await expect(service.enrichir(identifiantTest)).rejects.toThrow();
    });

    it("devrait persister l'echec meme si erreur", async () => {
      // Arrange
      cadastreEnrichissement.enrichir.mockRejectedValue(new Error("Service indisponible"));
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      try {
        await service.enrichir(identifiantTest);
      } catch {
        // Ignoré
      }

      // Assert
      expect(enrichissementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: StatutEnrichissement.ECHEC,
          messageErreur: "Service indisponible",
        }),
      );
    });

    it("devrait ne pas bloquer si le repository echoue", async () => {
      // Arrange
      const site = createMockSite();
      setupAllMocksSuccess(site, {
        cadastreEnrichissement,
        energieEnrichissement,
        transportEnrichissement,
        urbanismeEnrichissement,
        risquesNaturelsEnrichissement,
        risquesTechnologiquesEnrichissement,
        georisquesEnrichissement,
        zonageOrchestrator,
      });
      enrichissementRepository.save.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(service.enrichir(identifiantTest)).resolves.toBeDefined();
    });

    it("devrait inclure source et integrateur dans la persistence", async () => {
      // Arrange
      const site = createMockSite();
      setupAllMocksSuccess(site, {
        cadastreEnrichissement,
        energieEnrichissement,
        transportEnrichissement,
        urbanismeEnrichissement,
        risquesNaturelsEnrichissement,
        risquesTechnologiquesEnrichissement,
        georisquesEnrichissement,
        zonageOrchestrator,
      });
      enrichissementRepository.save.mockResolvedValue({});

      const sourceUtilisation = "cartofriches";
      const integrateur = "partenaire-test";

      // Act
      await service.enrichir(identifiantTest, sourceUtilisation, integrateur);

      // Assert
      expect(enrichissementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceUtilisation,
          integrateur,
        }),
      );
    });

    it("devrait appeler georisques seulement si coordonnees presentes", async () => {
      // Arrange
      const siteSansCoordonnees = createMockSite();
      siteSansCoordonnees.coordonnees = undefined;

      cadastreEnrichissement.enrichir.mockResolvedValue({
        site: siteSansCoordonnees,
        result: { success: true, sourcesUtilisees: ["cadastre"], sourcesEchouees: [] },
      });
      energieEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: [],
        sourcesEchouees: [],
      });
      transportEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: [],
        sourcesEchouees: [],
      });
      urbanismeEnrichissement.enrichir.mockResolvedValue({
        success: true,
        sourcesUtilisees: [],
        sourcesEchouees: [],
      });
      risquesNaturelsEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: [], sourcesEchouees: [] },
        evaluation: {
          rga: null,
          cavites: null,
          inondation: null,
          risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.AUCUN,
          risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
          risqueInondation: RisqueInondation.NON,
        },
      });
      risquesTechnologiquesEnrichissement.enrichir.mockResolvedValue({
        result: { success: true, sourcesUtilisees: [], sourcesEchouees: [] },
        evaluation: { sis: null, icpe: null, risqueFinal: false },
      });
      zonageOrchestrator.enrichirZonages.mockResolvedValue({
        result: { success: true, sourcesUtilisees: ["API_CARTO_GPU"], sourcesEchouees: [] },
        zonageEnvironnemental: "hors-zone",
        zonagePatrimonial: "non-concerne",
        zonageReglementaire: "zone-urbaine-u",
        evaluations: { environnemental: null, patrimonial: null, reglementaire: null },
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(georisquesEnrichissement.enrichir).not.toHaveBeenCalled();
    });
  });

  describe("cache", () => {
    const identifiantTest = "29232000AB0123";

    it("devrait retourner les donnees du cache si disponibles", async () => {
      // Arrange
      const cachedData = createMockCachedEnrichissement();
      enrichissementRepository.findValidCache.mockResolvedValue({
        id: "cached-id-123",
        donnees: cachedData,
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      const result = await service.enrichir(identifiantTest);

      // Assert
      expect(result).toEqual(cachedData);
      expect(enrichissementRepository.findValidCache).toHaveBeenCalledWith(identifiantTest);
    });

    it("devrait ne pas appeler les services si cache disponible", async () => {
      // Arrange
      const cachedData = createMockCachedEnrichissement();
      enrichissementRepository.findValidCache.mockResolvedValue({
        id: "cached-id-123",
        donnees: cachedData,
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(cadastreEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(energieEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(transportEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(urbanismeEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(risquesNaturelsEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(risquesTechnologiquesEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(georisquesEnrichissement.enrichir).not.toHaveBeenCalled();
      expect(pollutionDetection.detecterPollution).not.toHaveBeenCalled();
    });

    it("devrait enregistrer l'utilisation du cache avec enrichissementSourceId", async () => {
      // Arrange
      const cachedData = createMockCachedEnrichissement();
      const cacheSourceId = "cached-id-123";
      enrichissementRepository.findValidCache.mockResolvedValue({
        id: cacheSourceId,
        donnees: cachedData,
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest, "mutafriches", "test-integrateur");

      // Assert
      expect(enrichissementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          identifiantCadastral: identifiantTest,
          statut: StatutEnrichissement.SUCCES,
          enrichissementSourceId: cacheSourceId,
          sourceUtilisation: "mutafriches",
          integrateur: "test-integrateur",
        }),
      );
    });

    it("devrait faire un enrichissement complet si pas de cache", async () => {
      // Arrange
      enrichissementRepository.findValidCache.mockResolvedValue(null);
      const site = createMockSite();
      setupAllMocksSuccess(site, {
        cadastreEnrichissement,
        energieEnrichissement,
        transportEnrichissement,
        urbanismeEnrichissement,
        risquesNaturelsEnrichissement,
        risquesTechnologiquesEnrichissement,
        georisquesEnrichissement,
        zonageOrchestrator,
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(cadastreEnrichissement.enrichir).toHaveBeenCalledWith(identifiantTest);
      expect(energieEnrichissement.enrichir).toHaveBeenCalled();
    });

    it("devrait ne pas inclure enrichissementSourceId si enrichissement complet", async () => {
      // Arrange
      enrichissementRepository.findValidCache.mockResolvedValue(null);
      const site = createMockSite();
      setupAllMocksSuccess(site, {
        cadastreEnrichissement,
        energieEnrichissement,
        transportEnrichissement,
        urbanismeEnrichissement,
        risquesNaturelsEnrichissement,
        risquesTechnologiquesEnrichissement,
        georisquesEnrichissement,
        zonageOrchestrator,
      });
      enrichissementRepository.save.mockResolvedValue({});

      // Act
      await service.enrichir(identifiantTest);

      // Assert
      expect(enrichissementRepository.save).toHaveBeenCalledWith(
        expect.not.objectContaining({
          enrichissementSourceId: expect.any(String),
        }),
      );
    });
  });
});

// Helpers
function createMockSite(): Site {
  const site = new Site();
  site.identifiantParcelle = "29232000AB0123";
  site.codeInsee = "29232";
  site.commune = "Quimper";
  site.surfaceSite = 1000;
  site.coordonnees = { latitude: 48.0, longitude: -4.0 };
  site.geometrie = { type: "Polygon", coordinates: [] } as any;
  return site;
}

interface AllMocks {
  cadastreEnrichissement: ReturnType<typeof createMockCadastreEnrichissementService>;
  energieEnrichissement: ReturnType<typeof createMockEnergieEnrichissementService>;
  transportEnrichissement: ReturnType<typeof createMockTransportEnrichissementService>;
  urbanismeEnrichissement: ReturnType<typeof createMockUrbanismeEnrichissementService>;
  risquesNaturelsEnrichissement: ReturnType<typeof createMockRisquesNaturelsEnrichissementService>;
  risquesTechnologiquesEnrichissement: ReturnType<
    typeof createMockRisquesTechnologiquesEnrichissementService
  >;
  georisquesEnrichissement: ReturnType<typeof createMockGeoRisquesEnrichissementService>;
  zonageOrchestrator: ReturnType<typeof createMockZonageOrchestratorService>;
}

function setupAllMocksSuccess(site: Site, mocks: AllMocks): void {
  mocks.cadastreEnrichissement.enrichir.mockResolvedValue({
    site,
    result: { success: true, sourcesUtilisees: ["cadastre"], sourcesEchouees: [] },
  });
  mocks.energieEnrichissement.enrichir.mockResolvedValue({
    success: true,
    sourcesUtilisees: ["enedis"],
    sourcesEchouees: [],
  });
  mocks.transportEnrichissement.enrichir.mockResolvedValue({
    success: true,
    sourcesUtilisees: ["transport"],
    sourcesEchouees: [],
  });
  mocks.urbanismeEnrichissement.enrichir.mockResolvedValue({
    success: true,
    sourcesUtilisees: ["overpass"],
    sourcesEchouees: [],
  });
  mocks.risquesNaturelsEnrichissement.enrichir.mockResolvedValue({
    result: { success: true, sourcesUtilisees: ["rga"], sourcesEchouees: [] },
    evaluation: {
      rga: null,
      cavites: null,
      inondation: null,
      risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.AUCUN,
      risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
      risqueInondation: RisqueInondation.NON,
    },
  });
  mocks.risquesTechnologiquesEnrichissement.enrichir.mockResolvedValue({
    result: { success: true, sourcesUtilisees: ["sis"], sourcesEchouees: [] },
    evaluation: { sis: null, icpe: null, risqueFinal: false },
  });
  mocks.georisquesEnrichissement.enrichir.mockResolvedValue({
    result: { success: true, sourcesUtilisees: ["georisques"], sourcesEchouees: [] },
    data: undefined,
  });
  mocks.zonageOrchestrator.enrichirZonages.mockResolvedValue({
    result: {
      success: true,
      sourcesUtilisees: ["API_CARTO_NATURE", "API_CARTO_GPU"],
      sourcesEchouees: [],
    },
    zonageEnvironnemental: "hors-zone",
    zonagePatrimonial: "non-concerne",
    zonageReglementaire: "zone-urbaine-u",
    evaluations: {
      environnemental: null,
      patrimonial: null,
      reglementaire: null,
    },
  });
}

function createMockCachedEnrichissement() {
  return {
    identifiantParcelle: "29232000AB0123",
    codeInsee: "29232",
    commune: "Quimper",
    surfaceSite: 1000,
    surfaceBati: 200,
    distanceRaccordementElectrique: 50,
    risqueRetraitGonflementArgile: "aucun",
    risqueCavitesSouterraines: "non",
    risqueInondation: "non",
    coordonnees: { latitude: 48.0, longitude: -4.0 },
    geometrie: { type: "Polygon", coordinates: [] },
    siteEnCentreVille: false,
    distanceAutoroute: 5000,
    distanceTransportCommun: 500,
    proximiteCommercesServices: true,
    tauxLogementsVacants: 0.05,
    presenceRisquesTechnologiques: false,
    siteReferencePollue: false,
    zonageEnvironnemental: "hors-zone",
    zonageReglementaire: "zone-urbaine-u",
    zonagePatrimonial: "non-concerne",
    sourcesUtilisees: ["cadastre", "enedis", "transport"],
    champsManquants: [],
    sourcesEchouees: [],
  };
}
