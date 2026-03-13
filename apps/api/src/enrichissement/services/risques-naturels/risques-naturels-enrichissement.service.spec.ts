import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  SourceEnrichissement,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";
import { RisquesNaturelsEnrichissementService } from "./risques-naturels-enrichissement.service";
import { RisquesNaturelsCalculator } from "./risques-naturels.calculator";
import { RgaService } from "../../adapters/georisques/rga/rga.service";
import { CavitesService } from "../../adapters/georisques/cavites/cavites.service";
import { TriService } from "../../adapters/georisques/tri/tri.service";
import { AziService } from "../../adapters/georisques/azi/azi.service";
import { PapiService } from "../../adapters/georisques/papi/papi.service";
import { PprService } from "../../adapters/georisques/ppr/ppr.service";
import { Site } from "../../../evaluation/entities/site.entity";
import {
  createMockRgaService,
  createMockCavitesService,
  createMockTriService,
  createMockAziService,
  createMockPapiService,
  createMockPprService,
  createMockRisquesNaturelsCalculator,
} from "../../__test-helpers__/enrichissement.mocks";

describe("RisquesNaturelsEnrichissementService", () => {
  let service: RisquesNaturelsEnrichissementService;
  let rgaService: ReturnType<typeof createMockRgaService>;
  let cavitesService: ReturnType<typeof createMockCavitesService>;
  let triService: ReturnType<typeof createMockTriService>;
  let aziService: ReturnType<typeof createMockAziService>;
  let papiService: ReturnType<typeof createMockPapiService>;
  let pprService: ReturnType<typeof createMockPprService>;
  let calculator: ReturnType<typeof createMockRisquesNaturelsCalculator>;

  beforeEach(async () => {
    const mockRga = createMockRgaService();
    const mockCavites = createMockCavitesService();
    const mockTri = createMockTriService();
    const mockAzi = createMockAziService();
    const mockPapi = createMockPapiService();
    const mockPpr = createMockPprService();
    const mockCalculator = createMockRisquesNaturelsCalculator();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RisquesNaturelsEnrichissementService,
        { provide: RgaService, useValue: mockRga },
        { provide: CavitesService, useValue: mockCavites },
        { provide: TriService, useValue: mockTri },
        { provide: AziService, useValue: mockAzi },
        { provide: PapiService, useValue: mockPapi },
        { provide: PprService, useValue: mockPpr },
        { provide: RisquesNaturelsCalculator, useValue: mockCalculator },
      ],
    }).compile();

    service = module.get<RisquesNaturelsEnrichissementService>(
      RisquesNaturelsEnrichissementService,
    );
    rgaService = mockRga;
    cavitesService = mockCavites;
    triService = mockTri;
    aziService = mockAzi;
    papiService = mockPapi;
    pprService = mockPpr;
    calculator = mockCalculator;
  });

  /**
   * Configure les mocks inondation pour retourner des valeurs par défaut (pas d'exposition)
   */
  function mockInondationDefaut() {
    triService.getTri.mockResolvedValue({ success: true, data: { exposition: false } });
    aziService.getAzi.mockResolvedValue({ success: true, data: { exposition: false } });
    papiService.getPapi.mockResolvedValue({ success: true, data: { exposition: false } });
    pprService.getPpr.mockResolvedValue({ success: true, data: { exposition: false } });
    calculator.evaluerInondation.mockReturnValue(RisqueInondation.NON);
  }

  function createSiteAvecCoordonnees(): Site {
    const site = new Site();
    site.identifiantParcelle = "29232000AB0123";
    site.coordonnees = { latitude: 48.0, longitude: -4.0 };
    return site;
  }

  describe("enrichir", () => {
    it("devrait enrichir les 3 critères de risque séparément", async () => {
      // Arrange
      const site = createSiteAvecCoordonnees();

      rgaService.getRga.mockResolvedValue({
        success: true,
        data: { alea: "Fort" },
      });
      cavitesService.getCavites.mockResolvedValue({
        success: true,
        data: { exposition: true, nombreCavites: 2, distancePlusProche: 300 },
      });
      triService.getTri.mockResolvedValue({ success: true, data: { exposition: true } });
      aziService.getAzi.mockResolvedValue({ success: true, data: { exposition: false } });
      papiService.getPapi.mockResolvedValue({ success: true, data: { exposition: false } });
      pprService.getPpr.mockResolvedValue({ success: true, data: { exposition: false } });

      calculator.transformRgaToRisque.mockReturnValue(RisqueRetraitGonflementArgile.FORT);
      calculator.transformCavitesToRisque.mockReturnValue(RisqueCavitesSouterraines.OUI);
      calculator.evaluerInondation.mockReturnValue(RisqueInondation.OUI);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(calculator.transformRgaToRisque).toHaveBeenCalledWith("Fort");
      expect(calculator.transformCavitesToRisque).toHaveBeenCalledWith({
        exposition: true,
        nombreCavites: 2,
        distancePlusProche: 300,
      });
      expect(calculator.evaluerInondation).toHaveBeenCalledWith(true, false, false, false);
      expect(site.risqueRetraitGonflementArgile).toBe(RisqueRetraitGonflementArgile.FORT);
      expect(site.risqueCavitesSouterraines).toBe(RisqueCavitesSouterraines.OUI);
      expect(site.risqueInondation).toBe(RisqueInondation.OUI);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_TRI);
    });

    it("devrait enrichir meme si RGA echoue", async () => {
      // Arrange
      const site = createSiteAvecCoordonnees();

      rgaService.getRga.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      cavitesService.getCavites.mockResolvedValue({
        success: true,
        data: { exposition: true, nombreCavites: 1, distancePlusProche: 400 },
      });
      mockInondationDefaut();

      calculator.transformCavitesToRisque.mockReturnValue(RisqueCavitesSouterraines.OUI);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(site.risqueRetraitGonflementArgile).toBe(RisqueRetraitGonflementArgile.AUCUN);
      expect(site.risqueCavitesSouterraines).toBe(RisqueCavitesSouterraines.OUI);
    });

    it("devrait enrichir meme si Cavites echoue", async () => {
      // Arrange
      const site = createSiteAvecCoordonnees();

      rgaService.getRga.mockResolvedValue({
        success: true,
        data: { alea: "Moyen" },
      });
      cavitesService.getCavites.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      mockInondationDefaut();

      calculator.transformRgaToRisque.mockReturnValue(
        RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
      );

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(site.risqueRetraitGonflementArgile).toBe(
        RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
      );
      expect(site.risqueCavitesSouterraines).toBe(RisqueCavitesSouterraines.NON);
    });

    it("devrait retourner les valeurs par defaut si tous les services echouent", async () => {
      // Arrange
      const site = createSiteAvecCoordonnees();

      rgaService.getRga.mockResolvedValue({ success: false, error: "Service indisponible" });
      cavitesService.getCavites.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });
      triService.getTri.mockRejectedValue(new Error("Timeout"));
      aziService.getAzi.mockRejectedValue(new Error("Timeout"));
      papiService.getPapi.mockRejectedValue(new Error("Timeout"));
      pprService.getPpr.mockRejectedValue(new Error("Timeout"));
      calculator.evaluerInondation.mockReturnValue(RisqueInondation.NON);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toHaveLength(6);
      expect(site.risqueRetraitGonflementArgile).toBe(RisqueRetraitGonflementArgile.AUCUN);
      expect(site.risqueCavitesSouterraines).toBe(RisqueCavitesSouterraines.NON);
      expect(site.risqueInondation).toBe(RisqueInondation.NON);
    });

    it("devrait retourner echec si pas de coordonnees", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "29232000AB0123";
      site.coordonnees = undefined;

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(false);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_TRI);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_AZI);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_PAPI);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_PPR);
      expect(site.risqueRetraitGonflementArgile).toBe(RisqueRetraitGonflementArgile.AUCUN);
      expect(site.risqueCavitesSouterraines).toBe(RisqueCavitesSouterraines.NON);
      expect(site.risqueInondation).toBe(RisqueInondation.NON);
    });

    it("devrait appeler les 6 services en parallele", async () => {
      // Arrange
      const site = createSiteAvecCoordonnees();
      const callTimes: number[] = [];

      rgaService.getRga.mockImplementation(async () => {
        callTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { alea: "Fort" } };
      });

      cavitesService.getCavites.mockImplementation(async () => {
        callTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { exposition: true, nombreCavites: 1 } };
      });

      triService.getTri.mockImplementation(async () => {
        callTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { exposition: false } };
      });

      aziService.getAzi.mockImplementation(async () => {
        callTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { exposition: false } };
      });

      papiService.getPapi.mockImplementation(async () => {
        callTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { exposition: false } };
      });

      pprService.getPpr.mockImplementation(async () => {
        callTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { exposition: false } };
      });

      calculator.transformRgaToRisque.mockReturnValue(RisqueRetraitGonflementArgile.FORT);
      calculator.transformCavitesToRisque.mockReturnValue(RisqueCavitesSouterraines.NON);
      calculator.evaluerInondation.mockReturnValue(RisqueInondation.NON);

      // Act
      await service.enrichir(site);

      // Assert - tous les appels démarrés quasi simultanément
      expect(callTimes).toHaveLength(6);
      const maxDiff = Math.max(...callTimes) - Math.min(...callTimes);
      expect(maxDiff).toBeLessThan(10);
    });

    it("devrait detecter l'inondation via TRI/AZI/PAPI/PPR", async () => {
      // Arrange
      const site = createSiteAvecCoordonnees();

      rgaService.getRga.mockResolvedValue({
        success: true,
        data: { alea: "Nul" },
      });
      cavitesService.getCavites.mockResolvedValue({
        success: true,
        data: { exposition: false, nombreCavites: 0 },
      });
      triService.getTri.mockResolvedValue({ success: true, data: { exposition: false } });
      aziService.getAzi.mockResolvedValue({ success: true, data: { exposition: true } });
      papiService.getPapi.mockResolvedValue({ success: true, data: { exposition: true } });
      pprService.getPpr.mockResolvedValue({ success: true, data: { exposition: false } });

      calculator.transformRgaToRisque.mockReturnValue(RisqueRetraitGonflementArgile.AUCUN);
      calculator.transformCavitesToRisque.mockReturnValue(RisqueCavitesSouterraines.NON);
      calculator.evaluerInondation.mockReturnValue(RisqueInondation.OUI);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(calculator.evaluerInondation).toHaveBeenCalledWith(false, true, true, false);
      expect(site.risqueInondation).toBe(RisqueInondation.OUI);
      expect(result.success).toBe(true);
    });
  });
});
