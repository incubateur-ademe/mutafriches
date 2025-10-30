import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { EnrichissementService } from "./enrichissement.service";
import { CadastreService } from "./external/cadastre/cadastre.service";
import { BdnbService } from "./external/bdnb/bdnb.service";
import { EnedisService } from "./external/enedis/enedis.service";
import { RisqueNaturel, SourceEnrichissement } from "@mutafriches/shared-types";
import { EnrichissementRepository } from "../repository/enrichissement.repository";
import { RgaService } from "./external/georisques/rga/rga.service";
import { CatnatService } from "./external/georisques/catnat/catnat.service";
import { TriZonageService } from "./external/georisques/tri-zonage/tri-zonage.service";
import { MvtService } from "./external/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./external/georisques/zonage-sismique/zonage-sismique.service";
import { CavitesService } from "./external/georisques/cavites/cavites.service";
import { OldService } from "./external/georisques/old/old.service";
import { SisService } from "./external/georisques/sis/sis.service";
import { IcpeService } from "./external/georisques/icpe/icpe.service";
import { TriService } from "./external/georisques/tri/tri.service";

describe("EnrichissementService", () => {
  let service: EnrichissementService;
  let cadastreService: CadastreService;
  let bdnbService: BdnbService;
  let enedisService: EnedisService;
  let rgaService: RgaService;
  let cavitesService: CavitesService;
  let sisService: SisService;
  let icpeService: IcpeService;

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
            getRga: vi.fn(),
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
          provide: TriZonageService,
          useValue: {
            getTri: vi.fn().mockResolvedValue({
              success: false,
              error: "Non mocké",
              source: SourceEnrichissement.GEORISQUES_TRI_ZONAGE,
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
            getCavites: vi.fn(),
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
            getSisByLatLon: vi.fn(),
          },
        },
        {
          provide: IcpeService,
          useValue: {
            getIcpeByLatLon: vi.fn(),
          },
        },
        {
          provide: EnrichissementRepository,
          useValue: {
            save: vi.fn().mockResolvedValue("mock-log-id"),
          },
        },
      ],
    }).compile();

    service = module.get<EnrichissementService>(EnrichissementService);
    cadastreService = module.get<CadastreService>(CadastreService);
    bdnbService = module.get<BdnbService>(BdnbService);
    enedisService = module.get<EnedisService>(EnedisService);
    rgaService = module.get<RgaService>(RgaService);
    cavitesService = module.get<CavitesService>(CavitesService);
    sisService = module.get<SisService>(SisService);
    icpeService = module.get<IcpeService>(IcpeService);
  });

  describe("enrichir", () => {
    it("devrait enrichir une parcelle avec succès", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 42780,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: true,
        data: 6600,
        source: "BDNB",
      });

      vi.mocked(rgaService.getRga).mockResolvedValue({
        success: true,
        data: {
          alea: "Faible",
        } as any,
        source: SourceEnrichissement.GEORISQUES_RGA,
      });

      vi.mocked(cavitesService.getCavites).mockResolvedValue({
        success: true,
        data: {
          exposition: false,
          nombreCavites: 0,
          cavitesProches: [],
          typesCavites: [],
          source: SourceEnrichissement.GEORISQUES_CAVITES,
          dateRecuperation: new Date().toISOString(),
        } as any,
        source: SourceEnrichissement.GEORISQUES_CAVITES,
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceSis: false,
        } as any,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceIcpe: false,
          nombreIcpe: 0,
          icpeProches: [],
          presenceSeveso: false,
          nombreSeveso: 0,
          presencePrioriteNationale: false,
          source: SourceEnrichissement.GEORISQUES_ICPE,
          dateRecuperation: new Date().toISOString(),
        } as any,
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: true,
        data: {
          distance: 150,
        } as any,
        source: "Enedis-Raccordement",
      });

      const result = await service.enrichir(identifiantParcelle);

      expect(result).toBeDefined();
      expect(result.identifiantParcelle).toBe(identifiantParcelle);
      expect(result.codeInsee).toBe("49005");
      expect(result.commune).toBe("Angers");
      expect(result.surfaceSite).toBe(42780);
      expect(result.surfaceBati).toBe(6600);
      expect(result.distanceRaccordementElectrique).toBe(150);
      expect(result.presenceRisquesNaturels).toBe(RisqueNaturel.FAIBLE);
      expect(result.presenceRisquesTechnologiques).toBe(false);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BDNB);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
      expect(result.fiabilite).toBeGreaterThan(5);
      expect(result.fiabilite).toBeLessThanOrEqual(10);
    });

    it("devrait gérer les erreurs du service cadastre", async () => {
      const identifiantParcelle = "INVALID";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: false,
        error: "Parcelle non trouvée",
        source: "Cadastre",
      });

      await expect(service.enrichir(identifiantParcelle)).rejects.toThrow(
        "Données cadastrales introuvables",
      );
    });

    it("devrait continuer même si certains services optionnels échouent", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: "BDNB",
      });

      vi.mocked(rgaService.getRga).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: SourceEnrichissement.GEORISQUES_RGA,
      });

      vi.mocked(cavitesService.getCavites).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: SourceEnrichissement.GEORISQUES_CAVITES,
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: false,
        error: "Service indisponible",
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        error: "Données non disponibles",
        source: "Enedis-Raccordement",
      });

      const result = await service.enrichir(identifiantParcelle);

      expect(result).toBeDefined();
      expect(result.surfaceSite).toBe(10000);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.CADASTRE);
      expect(result.sourcesUtilisees).not.toContain(SourceEnrichissement.BDNB);
      expect(result.champsManquants).toContain("surfaceBati");
      expect(result.champsManquants).toContain("distanceRaccordementElectrique");

      expect(result.fiabilite).toBeDefined();
      expect(result.fiabilite).toBeGreaterThan(0);
    });

    it("devrait transformer correctement les risques naturels RGA", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        source: "BDNB",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        source: "Enedis-Raccordement",
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      // Cavités toujours aucune pour ce test (on teste uniquement RGA)
      vi.mocked(cavitesService.getCavites).mockResolvedValue({
        success: true,
        data: {
          exposition: false,
          nombreCavites: 0,
          cavitesProches: [],
          typesCavites: [],
          source: SourceEnrichissement.GEORISQUES_CAVITES,
          dateRecuperation: new Date().toISOString(),
        } as any,
        source: SourceEnrichissement.GEORISQUES_CAVITES,
      });

      // Test avec RGA seul (Cavités = AUCUN)
      // Fort + Aucun = Moyen, Moyen + Aucun = Moyen, Faible + Aucun = Faible, Aucun + Aucun = Aucun
      const testCases = [
        { alea: "Fort", expected: RisqueNaturel.MOYEN },
        { alea: "Moyen", expected: RisqueNaturel.MOYEN },
        { alea: "Faible", expected: RisqueNaturel.FAIBLE },
        { alea: "Nul", expected: RisqueNaturel.AUCUN },
      ];

      for (const testCase of testCases) {
        vi.mocked(rgaService.getRga).mockResolvedValue({
          success: true,
          data: { alea: testCase.alea } as any,
          source: SourceEnrichissement.GEORISQUES_RGA,
        });

        const result = await service.enrichir(identifiantParcelle);
        expect(result.presenceRisquesNaturels).toBe(testCase.expected);
      }
    });

    it("devrait transformer correctement les risques naturels Cavités", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        source: "BDNB",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        source: "Enedis-Raccordement",
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      // RGA toujours faible pour ce test (on teste uniquement Cavités)
      vi.mocked(rgaService.getRga).mockResolvedValue({
        success: true,
        data: { alea: "Faible" } as any,
        source: SourceEnrichissement.GEORISQUES_RGA,
      });

      // Test avec différentes distances de cavités (RGA = FAIBLE)
      // Fort + Faible = Moyen, Moyen + Faible = Moyen, Faible + Faible = Faible
      const testCases = [
        { distance: 300, expected: RisqueNaturel.MOYEN }, // Cavité FORT + RGA FAIBLE = MOYEN
        { distance: 700, expected: RisqueNaturel.MOYEN }, // Cavité MOYEN + RGA FAIBLE = MOYEN
        { distance: 1200, expected: RisqueNaturel.FAIBLE }, // Cavité FAIBLE + RGA FAIBLE = FAIBLE
      ];

      for (const testCase of testCases) {
        vi.mocked(cavitesService.getCavites).mockResolvedValue({
          success: true,
          data: {
            exposition: true,
            nombreCavites: 1,
            cavitesProches: [],
            typesCavites: ["Cave"],
            distancePlusProche: testCase.distance,
            source: SourceEnrichissement.GEORISQUES_CAVITES,
            dateRecuperation: new Date().toISOString(),
          } as any,
          source: SourceEnrichissement.GEORISQUES_CAVITES,
        });

        const result = await service.enrichir(identifiantParcelle);
        expect(result.presenceRisquesNaturels).toBe(testCase.expected);
      }
    });

    it("devrait combiner correctement RGA et Cavités", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        source: "BDNB",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        source: "Enedis-Raccordement",
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      // Test de combinaisons RGA + Cavités
      const testCases = [
        { rga: "Fort", caviteDistance: 300, expected: RisqueNaturel.FORT },
        { rga: "Fort", caviteDistance: 700, expected: RisqueNaturel.FORT },
        { rga: "Fort", caviteDistance: 1500, expected: RisqueNaturel.MOYEN },
        { rga: "Moyen", caviteDistance: 300, expected: RisqueNaturel.FORT },
        { rga: "Moyen", caviteDistance: 700, expected: RisqueNaturel.MOYEN },
        { rga: "Moyen", caviteDistance: 1500, expected: RisqueNaturel.MOYEN },
        { rga: "Faible", caviteDistance: 300, expected: RisqueNaturel.MOYEN },
        { rga: "Faible", caviteDistance: 700, expected: RisqueNaturel.MOYEN },
        { rga: "Faible", caviteDistance: 1500, expected: RisqueNaturel.FAIBLE },
        { rga: "Fort", caviteDistance: undefined, expected: RisqueNaturel.MOYEN },
        { rga: "Faible", caviteDistance: undefined, expected: RisqueNaturel.FAIBLE },
      ];

      for (const testCase of testCases) {
        vi.mocked(rgaService.getRga).mockResolvedValue({
          success: true,
          data: { alea: testCase.rga } as any,
          source: SourceEnrichissement.GEORISQUES_RGA,
        });

        if (testCase.caviteDistance === undefined) {
          vi.mocked(cavitesService.getCavites).mockResolvedValue({
            success: true,
            data: {
              exposition: false,
              nombreCavites: 0,
              cavitesProches: [],
              typesCavites: [],
              source: SourceEnrichissement.GEORISQUES_CAVITES,
              dateRecuperation: new Date().toISOString(),
            } as any,
            source: SourceEnrichissement.GEORISQUES_CAVITES,
          });
        } else {
          vi.mocked(cavitesService.getCavites).mockResolvedValue({
            success: true,
            data: {
              exposition: true,
              nombreCavites: 1,
              cavitesProches: [],
              typesCavites: ["Cave"],
              distancePlusProche: testCase.caviteDistance,
              source: SourceEnrichissement.GEORISQUES_CAVITES,
              dateRecuperation: new Date().toISOString(),
            } as any,
            source: SourceEnrichissement.GEORISQUES_CAVITES,
          });
        }

        const result = await service.enrichir(identifiantParcelle);
        expect(result.presenceRisquesNaturels).toBe(testCase.expected);
      }
    });

    it("devrait détecter les risques technologiques avec présence SIS", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        source: "BDNB",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        source: "Enedis-Raccordement",
      });

      vi.mocked(rgaService.getRga).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_RGA,
      });

      vi.mocked(cavitesService.getCavites).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_CAVITES,
      });

      // Présence SIS = risque technologique OUI
      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceSis: true,
        } as any,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceIcpe: false,
          nombreIcpe: 0,
          icpeProches: [],
          presenceSeveso: false,
          nombreSeveso: 0,
          presencePrioriteNationale: false,
          source: SourceEnrichissement.GEORISQUES_ICPE,
          dateRecuperation: new Date().toISOString(),
        } as any,
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      const result = await service.enrichir(identifiantParcelle);

      expect(result.presenceRisquesTechnologiques).toBe(true);
    });

    it("devrait détecter les risques technologiques avec ICPE proche", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: false,
        source: "BDNB",
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: false,
        source: "Enedis-Raccordement",
      });

      vi.mocked(rgaService.getRga).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_RGA,
      });

      vi.mocked(cavitesService.getCavites).mockResolvedValue({
        success: false,
        source: SourceEnrichissement.GEORISQUES_CAVITES,
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceSis: false,
        } as any,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      const testCases = [
        { distance: 300, expected: true }, // ICPE <= 500m = risque OUI
        { distance: 500, expected: true }, // ICPE = 500m = risque OUI
        { distance: 700, expected: false }, // ICPE > 500m = risque NON
        { distance: undefined, expected: false }, // Pas d'ICPE = risque NON
      ];

      for (const testCase of testCases) {
        vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
          success: true,
          data: {
            presenceIcpe: testCase.distance !== undefined,
            nombreIcpe: testCase.distance !== undefined ? 1 : 0,
            icpeProches: [],
            presenceSeveso: false,
            nombreSeveso: 0,
            presencePrioriteNationale: false,
            distancePlusProche: testCase.distance,
            source: SourceEnrichissement.GEORISQUES_ICPE,
            dateRecuperation: new Date().toISOString(),
          } as any,
          source: SourceEnrichissement.GEORISQUES_ICPE,
        });

        const result = await service.enrichir(identifiantParcelle);
        expect(result.presenceRisquesTechnologiques).toBe(testCase.expected);
      }
    });

    it("devrait calculer correctement la fiabilité", async () => {
      const identifiantParcelle = "490055000AI0001";

      vi.mocked(cadastreService.getParcelleInfo).mockResolvedValue({
        success: true,
        data: {
          identifiant: identifiantParcelle,
          codeInsee: "49005",
          commune: "Angers",
          surface: 10000,
          coordonnees: {
            latitude: 47.4784,
            longitude: -0.5607,
          },
          geometrie: {} as any,
        } as any,
        source: "Cadastre",
      });

      vi.mocked(bdnbService.getSurfaceBatie).mockResolvedValue({
        success: true,
        data: 2000,
        source: "BDNB",
      });

      vi.mocked(rgaService.getRga).mockResolvedValue({
        success: true,
        data: { alea: "Faible" } as any,
        source: SourceEnrichissement.GEORISQUES_RGA,
      });

      vi.mocked(cavitesService.getCavites).mockResolvedValue({
        success: true,
        data: {
          exposition: false,
          nombreCavites: 0,
          cavitesProches: [],
          typesCavites: [],
          source: SourceEnrichissement.GEORISQUES_CAVITES,
          dateRecuperation: new Date().toISOString(),
        } as any,
        source: SourceEnrichissement.GEORISQUES_CAVITES,
      });

      vi.mocked(sisService.getSisByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceSis: false,
        } as any,
        source: SourceEnrichissement.GEORISQUES_SIS,
      });

      vi.mocked(icpeService.getIcpeByLatLon).mockResolvedValue({
        success: true,
        data: {
          presenceIcpe: false,
          nombreIcpe: 0,
          icpeProches: [],
          presenceSeveso: false,
          nombreSeveso: 0,
          presencePrioriteNationale: false,
          source: SourceEnrichissement.GEORISQUES_ICPE,
          dateRecuperation: new Date().toISOString(),
        } as any,
        source: SourceEnrichissement.GEORISQUES_ICPE,
      });

      vi.mocked(enedisService.getDistanceRaccordement).mockResolvedValue({
        success: true,
        data: { distance: 100 } as any,
        source: "Enedis-Raccordement",
      });

      const result = await service.enrichir(identifiantParcelle);

      expect(result.fiabilite).toBeGreaterThanOrEqual(8);
      expect(result.sourcesUtilisees.length).toBeGreaterThan(5);
      expect(result.champsManquants.length).toBeLessThan(5);
    });
  });
});
