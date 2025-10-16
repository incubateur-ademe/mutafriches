import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { EnrichissementService } from "./enrichissement.service";
import { CadastreService } from "./external/cadastre/cadastre.service";
import { BdnbService } from "./external/bdnb/bdnb.service";
import { EnedisService } from "./external/enedis/enedis.service";
import { RisqueNaturel } from "@mutafriches/shared-types";
import { LogsEnrichissementRepository } from "../repository/logs-enrichissement.repository";
import { RgaService } from "./external/georisques/rga/rga.service";
import { CatnatService } from "./external/georisques/catnat/catnat.service";
import { TriService } from "./external/georisques/tri/tri.service";
import { MvtService } from "./external/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./external/georisques/zonage-sismique/zonage-sismique.service";
import { SourceEnrichissement } from "./enrichissement.constants";
import { CavitesService } from "./external/georisques/cavites/cavites.service";
import { OldService } from "./external/georisques/old/old.service";
import { SisService } from "./external/georisques/sis/sis.service";

describe("EnrichissementService", () => {
  let service: EnrichissementService;
  let cadastreService: CadastreService;
  let bdnbService: BdnbService;
  let enedisService: EnedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichissementService,
        {
          provide: CadastreService,
          useValue: {
            getParcelleInfo: vi.fn(),
          },
        },
        {
          provide: BdnbService,
          useValue: {
            getSurfaceBatie: vi.fn(),
            getRisquesNaturels: vi.fn(),
          },
        },
        {
          provide: EnedisService,
          useValue: {
            checkConnection: vi.fn(),
            getDistanceRaccordement: vi.fn(),
          },
        },
        {
          provide: RgaService,
          useValue: {
            getRga: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_RGA,
            }),
          },
        },
        {
          provide: CatnatService,
          useValue: {
            getCatnat: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_CATNAT,
            }),
          },
        },
        {
          provide: TriService,
          useValue: {
            getTri: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_TRI,
            }),
          },
        },
        {
          provide: MvtService,
          useValue: {
            getMvt: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_MVT,
            }),
          },
        },
        {
          provide: ZonageSismiqueService,
          useValue: {
            getZonageSismique: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE,
            }),
          },
        },
        {
          provide: CavitesService,
          useValue: {
            getCavites: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_CAVITES,
            }),
          },
        },
        {
          provide: OldService,
          useValue: {
            getOld: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_OLD,
            }),
          },
        },
        {
          provide: SisService,
          useValue: {
            getSisByLatLon: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_SIS,
            }),
          },
        },
        {
          provide: LogsEnrichissementRepository,
          useValue: {
            log: vi.fn().mockResolvedValue("mock-log-id"),
          },
        },
      ],
    }).compile();

    service = module.get<EnrichissementService>(EnrichissementService);
    cadastreService = module.get<CadastreService>(CadastreService);
    bdnbService = module.get<BdnbService>(BdnbService);
    enedisService = module.get<EnedisService>(EnedisService);
  });

  describe("enrichir", () => {
    it("devrait enrichir une parcelle avec succès", async () => {
      // Données de test
      const identifiantParcelle = "490055000AI0001";

      // Configuration des mocks avec as any pour simplifier
      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          commune: "49005",
          surface: 42780,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: true,
        data: 6600,
        source: "BDNB",
      });

      vi.mocked(bdnbService.getRisquesNaturels).mockResolvedValue({
        success: true,
        data: {
          aleaArgiles: "Faible",
        } as any,
        source: "BDNB-Risques",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: true,
        data: {
          distance: 150,
        } as any,
        source: "Enedis-Raccordement",
      });

      // Exécuter la méthode
      const result = await service.enrichir(identifiantParcelle);

      // Vérifications
      expect(result).toBeDefined();
      expect(result.identifiantParcelle).toBe(identifiantParcelle);
      expect(result.commune).toBe("49005");
      expect(result.surfaceSite).toBe(42780);
      expect(result.surfaceBati).toBe(6600);
      expect(result.distanceRaccordementElectrique).toBe(150);
      expect(result.presenceRisquesNaturels).toBe(RisqueNaturel.FAIBLE);
      expect(result.sourcesUtilisees).toContain("Cadastre");
      expect(result.sourcesUtilisees).toContain("BDNB");
      expect(result.sourcesUtilisees).toContain("Enedis-Raccordement");
      expect(result.sourcesUtilisees).toContain("BDNB-Risques");
      expect(result.fiabilite).toBeGreaterThan(5);
      expect(result.fiabilite).toBeLessThanOrEqual(10);
    });

    it("devrait gérer les erreurs du service cadastre", async () => {
      const identifiantParcelle = "INVALID";

      // Mock d'une erreur du cadastre - données obligatoires
      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: false,
        error: "Parcelle non trouvée",
        source: "Cadastre",
      });

      // Vérifier que l'erreur est bien gérée
      await expect(service.enrichir(identifiantParcelle)).rejects.toThrow(
        "Données cadastrales introuvables",
      );
    });

    it("devrait continuer même si certains services optionnels échouent", async () => {
      const identifiantParcelle = "490055000AI0001";

      // Cadastre fonctionne (obligatoire)
      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          commune: "49005",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
        } as any,
        source: "Cadastre",
      });

      // BDNB surface échoue
      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: "BDNB",
      });

      // BDNB risques échoue
      vi.mocked(bdnbService.getRisquesNaturels).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: "BDNB-Risques",
      });

      // Enedis raccordement échoue
      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        error: "Données non disponibles",
        source: "Enedis-Raccordement",
      });

      const result = await service.enrichir(identifiantParcelle);

      // Vérifications
      expect(result).toBeDefined();
      expect(result.surfaceSite).toBe(10000);
      expect(result.sourcesUtilisees).toContain("Cadastre");
      expect(result.sourcesUtilisees).not.toContain("BDNB");
      expect(result.champsManquants).toContain("surfaceBati");
      expect(result.champsManquants).toContain("distanceRaccordementElectrique");
      expect(result.champsManquants).toContain("presenceRisquesNaturels");

      // Verifier que la fiabilité est basse mais définie
      // TODO: ajuster cette valeur en fonction de la formule de fiabilité
      expect(result.fiabilite).toBeDefined();
      expect(result.fiabilite).toBeGreaterThan(0);
    });

    it("devrait transformer correctement les risques naturels", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          commune: "49005",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
        } as any,
        source: "Cadastre",
      });

      // Test différents niveaux de risques
      const testCases = [
        { aleaArgiles: "Fort", expected: RisqueNaturel.FORT },
        { aleaArgiles: "Moyen", expected: RisqueNaturel.MOYEN },
        { aleaArgiles: "Faible", expected: RisqueNaturel.FAIBLE },
        { aleaArgiles: "Nul", expected: RisqueNaturel.AUCUN },
      ];

      for (const testCase of testCases) {
        vi.mocked(bdnbService.getRisquesNaturels).mockResolvedValue({
          success: true,
          data: { aleaArgiles: testCase.aleaArgiles } as any,
          source: "BDNB-Risques",
        });

        // Mock les autres services pour éviter les erreurs
        vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
          success: false,
          source: "BDNB",
        });
        vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
          success: false,
          source: "Enedis-Raccordement",
        });

        const result = await service.enrichir(identifiantParcelle);
        expect(result.presenceRisquesNaturels).toBe(testCase.expected);
      }
    });

    it("devrait calculer correctement la fiabilité", async () => {
      const identifiantParcelle = "490055000AI0001";

      // Test avec toutes les sources disponibles
      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          commune: "49005",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: true,
        data: 2000,
        source: "BDNB",
      });

      vi.mocked(bdnbService.getRisquesNaturels).mockResolvedValue({
        success: true,
        data: { aleaArgiles: "Faible" } as any,
        source: "BDNB-Risques",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: true,
        data: { distance: 100 } as any,
        source: "Enedis-Raccordement",
      });

      const result = await service.enrichir(identifiantParcelle);

      // Avec toutes les sources et peu de champs manquants, la fiabilité devrait être élevée
      expect(result.fiabilite).toBeGreaterThanOrEqual(8);
      expect(result.sourcesUtilisees.length).toBeGreaterThan(5);
      expect(result.champsManquants.length).toBeLessThan(5);
    });
  });
});
