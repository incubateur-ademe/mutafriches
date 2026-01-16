import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { StatutEnrichissement, RisqueNaturel, SourceUtilisation } from "@mutafriches/shared-types";
import { EnrichissementService } from "./enrichissement.service";
import { CadastreEnrichissementService } from "./cadastre/cadastre-enrichissement.service";
import { EnergieEnrichissementService } from "./energie/energie-enrichissement.service";
import { TransportEnrichissementService } from "./transport/transport-enrichissement.service";
import { UrbanismeEnrichissementService } from "./urbanisme/urbanisme-enrichissement.service";
import { RisquesNaturelsEnrichissementService } from "./risques-naturels/risques-naturels-enrichissement.service";
import { RisquesTechnologiquesEnrichissementService } from "./risques-technologiques/risques-technologiques-enrichissement.service";
import { GeoRisquesEnrichissementService } from "./georisques/georisques-enrichissement.service";
import { EnrichissementRepository } from "../repositories/enrichissement.repository";
import { AdemeSitesPolluesRepository } from "../repositories/ademe-sites-pollues.repository";
import { Parcelle } from "../../evaluation/entities/parcelle.entity";
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
} from "../__test-helpers__/enrichissement.mocks";
import { ZonageOrchestratorService } from "./zonage";

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
    const mockRepository = createMockEnrichissementRepository();
    const mockAdemeSitesPolluesRepository = {
      findByParcelle: vi.fn().mockResolvedValue([]),
      isSiteReferencePollue: vi.fn().mockResolvedValue(false),
    };

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
        { provide: EnrichissementRepository, useValue: mockRepository },
        { provide: AdemeSitesPolluesRepository, useValue: mockAdemeSitesPolluesRepository },
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
    enrichissementRepository = mockRepository;
  });

  describe("enrichir", () => {
    const identifiantTest = "29232000AB0123";

    it("devrait orchestrer tous les sous-domaines dans l'ordre", async () => {
      // Arrange
      const parcelle = createMockParcelle();
      cadastreEnrichissement.enrichir.mockResolvedValue({
        parcelle,
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
        evaluation: { rga: null, cavites: null, risqueFinal: RisqueNaturel.AUCUN },
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
      expect(energieEnrichissement.enrichir).toHaveBeenCalledWith(parcelle);
      expect(transportEnrichissement.enrichir).toHaveBeenCalledWith(parcelle);
      expect(urbanismeEnrichissement.enrichir).toHaveBeenCalledWith(parcelle);
      expect(risquesNaturelsEnrichissement.enrichir).toHaveBeenCalledWith(parcelle);
      expect(risquesTechnologiquesEnrichissement.enrichir).toHaveBeenCalledWith(parcelle);
      expect(georisquesEnrichissement.enrichir).toHaveBeenCalled();
    });

    it("devrait construire le DTO de sortie complet", async () => {
      // Arrange
      const parcelle = createMockParcelle();
      cadastreEnrichissement.enrichir.mockResolvedValue({
        parcelle,
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
        evaluation: { rga: null, cavites: null, risqueFinal: RisqueNaturel.AUCUN },
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
      expect(result.sourcesUtilisees).toHaveLength(9);
    });

    it("devrait persister l'enrichissement avec statut SUCCES", async () => {
      // Arrange
      const parcelle = createMockParcelle();
      setupAllMocksSuccess(parcelle, {
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
      const parcelle = createMockParcelle();
      cadastreEnrichissement.enrichir.mockResolvedValue({
        parcelle,
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
        evaluation: { rga: null, cavites: null, risqueFinal: RisqueNaturel.AUCUN },
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
        parcelle: null,
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
      const parcelle = createMockParcelle();
      setupAllMocksSuccess(parcelle, {
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
      const parcelle = createMockParcelle();
      setupAllMocksSuccess(parcelle, {
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
      const parcelleSansCoordonnees = createMockParcelle();
      parcelleSansCoordonnees.coordonnees = undefined;

      cadastreEnrichissement.enrichir.mockResolvedValue({
        parcelle: parcelleSansCoordonnees,
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
        evaluation: { rga: null, cavites: null, risqueFinal: RisqueNaturel.AUCUN },
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
});

// Helpers
function createMockParcelle(): Parcelle {
  const parcelle = new Parcelle();
  parcelle.identifiantParcelle = "29232000AB0123";
  parcelle.codeInsee = "29232";
  parcelle.commune = "Quimper";
  parcelle.surfaceSite = 1000;
  parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };
  parcelle.geometrie = { type: "Polygon", coordinates: [] } as any;
  return parcelle;
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

function setupAllMocksSuccess(parcelle: Parcelle, mocks: AllMocks): void {
  mocks.cadastreEnrichissement.enrichir.mockResolvedValue({
    parcelle,
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
    evaluation: { rga: null, cavites: null, risqueFinal: RisqueNaturel.AUCUN },
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
