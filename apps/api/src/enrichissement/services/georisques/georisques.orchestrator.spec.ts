import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { GeoRisquesOrchestrator } from "./georisques.orchestrator";
import { RgaService } from "../../adapters/georisques/rga/rga.service";
import { CatnatService } from "../../adapters/georisques/catnat/catnat.service";
import { TriZonageService } from "../../adapters/georisques/tri-zonage/tri-zonage.service";
import { TriService } from "../../adapters/georisques/tri/tri.service";
import { MvtService } from "../../adapters/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "../../adapters/georisques/zonage-sismique/zonage-sismique.service";
import { CavitesService } from "../../adapters/georisques/cavites/cavites.service";
import { OldService } from "../../adapters/georisques/old/old.service";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import { AziService } from "../../adapters/georisques/azi/azi.service";
import { PapiService } from "../../adapters/georisques/papi/papi.service";
import { PprService } from "../../adapters/georisques/ppr/ppr.service";

describe("GeoRisquesOrchestrator", () => {
  let orchestrator: GeoRisquesOrchestrator;
  let rgaService: { getRga: ReturnType<typeof vi.fn> };
  let catnatService: { getCatnat: ReturnType<typeof vi.fn> };
  let triZonageService: { getTri: ReturnType<typeof vi.fn> };
  let triService: { getTri: ReturnType<typeof vi.fn> };
  let mvtService: { getMvt: ReturnType<typeof vi.fn> };
  let zonageSismiqueService: { getZonageSismique: ReturnType<typeof vi.fn> };
  let cavitesService: { getCavites: ReturnType<typeof vi.fn> };
  let oldService: { getOld: ReturnType<typeof vi.fn> };
  let sisService: { getSisByLatLon: ReturnType<typeof vi.fn> };
  let icpeService: { getIcpeByLatLon: ReturnType<typeof vi.fn> };
  let aziService: { getAzi: ReturnType<typeof vi.fn> };
  let papiService: { getPapi: ReturnType<typeof vi.fn> };
  let pprService: { getPpr: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockRgaService = { getRga: vi.fn() };
    const mockCatnatService = { getCatnat: vi.fn() };
    const mockTriZonageService = { getTri: vi.fn() };
    const mockTriService = { getTri: vi.fn() };
    const mockMvtService = { getMvt: vi.fn() };
    const mockZonageSismiqueService = { getZonageSismique: vi.fn() };
    const mockCavitesService = { getCavites: vi.fn() };
    const mockOldService = { getOld: vi.fn() };
    const mockSisService = { getSisByLatLon: vi.fn() };
    const mockIcpeService = { getIcpeByLatLon: vi.fn() };
    const mockAziService = { getAzi: vi.fn() };
    const mockPapiService = { getPapi: vi.fn() };
    const mockPprService = { getPpr: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoRisquesOrchestrator,
        { provide: RgaService, useValue: mockRgaService },
        { provide: CatnatService, useValue: mockCatnatService },
        { provide: TriZonageService, useValue: mockTriZonageService },
        { provide: TriService, useValue: mockTriService },
        { provide: MvtService, useValue: mockMvtService },
        { provide: ZonageSismiqueService, useValue: mockZonageSismiqueService },
        { provide: CavitesService, useValue: mockCavitesService },
        { provide: OldService, useValue: mockOldService },
        { provide: SisService, useValue: mockSisService },
        { provide: IcpeService, useValue: mockIcpeService },
        { provide: AziService, useValue: mockAziService },
        { provide: PapiService, useValue: mockPapiService },
        { provide: PprService, useValue: mockPprService },
      ],
    }).compile();

    orchestrator = module.get<GeoRisquesOrchestrator>(GeoRisquesOrchestrator);
    rgaService = module.get(RgaService);
    catnatService = module.get(CatnatService);
    triZonageService = module.get(TriZonageService);
    triService = module.get(TriService);
    mvtService = module.get(MvtService);
    zonageSismiqueService = module.get(ZonageSismiqueService);
    cavitesService = module.get(CavitesService);
    oldService = module.get(OldService);
    sisService = module.get(SisService);
    icpeService = module.get(IcpeService);
    aziService = module.get(AziService);
    papiService = module.get(PapiService);
    pprService = module.get(PprService);
  });

  describe("fetchAll", () => {
    const coordonnees = { latitude: 48.0, longitude: -4.0 };

    it("devrait appeler tous les 13 services GeoRisques", async () => {
      // Arrange - Tous les services retournent succès
      rgaService.getRga.mockResolvedValue({ success: true, data: { alea: "Fort" } });
      catnatService.getCatnat.mockResolvedValue({ success: true, data: {} });
      triZonageService.getTri.mockResolvedValue({ success: true, data: {} });
      triService.getTri.mockResolvedValue({ success: true, data: {} });
      mvtService.getMvt.mockResolvedValue({ success: true, data: {} });
      zonageSismiqueService.getZonageSismique.mockResolvedValue({ success: true, data: {} });
      cavitesService.getCavites.mockResolvedValue({ success: true, data: {} });
      oldService.getOld.mockResolvedValue({ success: true, data: {} });
      sisService.getSisByLatLon.mockResolvedValue({ success: true, data: {} });
      icpeService.getIcpeByLatLon.mockResolvedValue({ success: true, data: {} });
      aziService.getAzi.mockResolvedValue({ success: true, data: {} });
      papiService.getPapi.mockResolvedValue({ success: true, data: {} });
      pprService.getPpr.mockResolvedValue({ success: true, data: {} });

      // Act
      await orchestrator.fetchAll(coordonnees);

      // Assert - Tous les services ont été appelés
      expect(rgaService.getRga).toHaveBeenCalled();
      expect(catnatService.getCatnat).toHaveBeenCalled();
      expect(triZonageService.getTri).toHaveBeenCalled();
      expect(triService.getTri).toHaveBeenCalled();
      expect(mvtService.getMvt).toHaveBeenCalled();
      expect(zonageSismiqueService.getZonageSismique).toHaveBeenCalled();
      expect(cavitesService.getCavites).toHaveBeenCalled();
      expect(oldService.getOld).toHaveBeenCalled();
      expect(sisService.getSisByLatLon).toHaveBeenCalled();
      expect(icpeService.getIcpeByLatLon).toHaveBeenCalled();
      expect(aziService.getAzi).toHaveBeenCalled();
      expect(papiService.getPapi).toHaveBeenCalled();
      expect(pprService.getPpr).toHaveBeenCalled();
    });

    it("devrait retourner fiabilite 10/10 si tous les services reussissent", async () => {
      // Arrange
      rgaService.getRga.mockResolvedValue({ success: true, data: {} });
      catnatService.getCatnat.mockResolvedValue({ success: true, data: {} });
      triZonageService.getTri.mockResolvedValue({ success: true, data: {} });
      triService.getTri.mockResolvedValue({ success: true, data: {} });
      mvtService.getMvt.mockResolvedValue({ success: true, data: {} });
      zonageSismiqueService.getZonageSismique.mockResolvedValue({ success: true, data: {} });
      cavitesService.getCavites.mockResolvedValue({ success: true, data: {} });
      oldService.getOld.mockResolvedValue({ success: true, data: {} });
      sisService.getSisByLatLon.mockResolvedValue({ success: true, data: {} });
      icpeService.getIcpeByLatLon.mockResolvedValue({ success: true, data: {} });
      aziService.getAzi.mockResolvedValue({ success: true, data: {} });
      papiService.getPapi.mockResolvedValue({ success: true, data: {} });
      pprService.getPpr.mockResolvedValue({ success: true, data: {} });

      // Act
      const result = await orchestrator.fetchAll(coordonnees);

      // Assert
      expect(result.data?.metadata.fiabilite).toBe(10);
      expect(result.sourcesUtilisees).toHaveLength(13);
      expect(result.sourcesEchouees).toHaveLength(0);
    });

    it("devrait continuer meme si certains services echouent", async () => {
      // Arrange - 10 services réussissent, 3 échouent
      rgaService.getRga.mockResolvedValue({ success: true, data: {} });
      catnatService.getCatnat.mockResolvedValue({ success: false, error: "Echec" });
      triZonageService.getTri.mockResolvedValue({ success: true, data: {} });
      triService.getTri.mockResolvedValue({ success: true, data: {} });
      mvtService.getMvt.mockResolvedValue({ success: false, error: "Echec" });
      zonageSismiqueService.getZonageSismique.mockResolvedValue({ success: true, data: {} });
      cavitesService.getCavites.mockResolvedValue({ success: true, data: {} });
      oldService.getOld.mockResolvedValue({ success: true, data: {} });
      sisService.getSisByLatLon.mockResolvedValue({ success: true, data: {} });
      icpeService.getIcpeByLatLon.mockResolvedValue({ success: false, error: "Echec" });
      aziService.getAzi.mockResolvedValue({ success: true, data: {} });
      papiService.getPapi.mockResolvedValue({ success: true, data: {} });
      pprService.getPpr.mockResolvedValue({ success: true, data: {} });

      // Act
      const result = await orchestrator.fetchAll(coordonnees);

      // Assert
      expect(result.sourcesUtilisees).toHaveLength(10);
      expect(result.sourcesEchouees).toHaveLength(3);
      expect(result.data?.metadata.fiabilite).toBeCloseTo(7.69, 1); // 10/13 * 10
    });

    it("devrait retourner undefined si tous les services echouent", async () => {
      // Arrange - Tous échouent
      rgaService.getRga.mockResolvedValue({ success: false, error: "Echec" });
      catnatService.getCatnat.mockResolvedValue({ success: false, error: "Echec" });
      triZonageService.getTri.mockResolvedValue({ success: false, error: "Echec" });
      triService.getTri.mockResolvedValue({ success: false, error: "Echec" });
      mvtService.getMvt.mockResolvedValue({ success: false, error: "Echec" });
      zonageSismiqueService.getZonageSismique.mockResolvedValue({ success: false, error: "Echec" });
      cavitesService.getCavites.mockResolvedValue({ success: false, error: "Echec" });
      oldService.getOld.mockResolvedValue({ success: false, error: "Echec" });
      sisService.getSisByLatLon.mockResolvedValue({ success: false, error: "Echec" });
      icpeService.getIcpeByLatLon.mockResolvedValue({ success: false, error: "Echec" });
      aziService.getAzi.mockResolvedValue({ success: false, error: "Echec" });
      papiService.getPapi.mockResolvedValue({ success: false, error: "Echec" });
      pprService.getPpr.mockResolvedValue({ success: false, error: "Echec" });

      // Act
      const result = await orchestrator.fetchAll(coordonnees);

      // Assert
      expect(result.data).toBeUndefined();
      expect(result.sourcesUtilisees).toHaveLength(0);
      expect(result.sourcesEchouees).toHaveLength(13);
    });

    it("devrait inclure les donnees dans le resultat pour les services reussis", async () => {
      // Arrange
      const rgaData = { alea: "Fort" };
      rgaService.getRga.mockResolvedValue({ success: true, data: rgaData });
      catnatService.getCatnat.mockResolvedValue({ success: true, data: {} });
      triZonageService.getTri.mockResolvedValue({ success: true, data: {} });
      triService.getTri.mockResolvedValue({ success: true, data: {} });
      mvtService.getMvt.mockResolvedValue({ success: true, data: {} });
      zonageSismiqueService.getZonageSismique.mockResolvedValue({ success: true, data: {} });
      cavitesService.getCavites.mockResolvedValue({ success: true, data: {} });
      oldService.getOld.mockResolvedValue({ success: true, data: {} });
      sisService.getSisByLatLon.mockResolvedValue({ success: true, data: {} });
      icpeService.getIcpeByLatLon.mockResolvedValue({ success: true, data: {} });
      aziService.getAzi.mockResolvedValue({ success: true, data: {} });
      papiService.getPapi.mockResolvedValue({ success: true, data: {} });
      pprService.getPpr.mockResolvedValue({ success: true, data: {} });

      // Act
      const result = await orchestrator.fetchAll(coordonnees);

      // Assert
      expect(result.data?.rga).toEqual(rgaData);
    });

    it("devrait gerer les erreurs sans bloquer les autres appels", async () => {
      // Arrange - Un service rejette, les autres réussissent
      rgaService.getRga.mockRejectedValue(new Error("Timeout"));
      catnatService.getCatnat.mockResolvedValue({ success: true, data: {} });
      triZonageService.getTri.mockResolvedValue({ success: true, data: {} });
      triService.getTri.mockResolvedValue({ success: true, data: {} });
      mvtService.getMvt.mockResolvedValue({ success: true, data: {} });
      zonageSismiqueService.getZonageSismique.mockResolvedValue({ success: true, data: {} });
      cavitesService.getCavites.mockResolvedValue({ success: true, data: {} });
      oldService.getOld.mockResolvedValue({ success: true, data: {} });
      sisService.getSisByLatLon.mockResolvedValue({ success: true, data: {} });
      icpeService.getIcpeByLatLon.mockResolvedValue({ success: true, data: {} });
      aziService.getAzi.mockResolvedValue({ success: true, data: {} });
      papiService.getPapi.mockResolvedValue({ success: true, data: {} });
      pprService.getPpr.mockResolvedValue({ success: true, data: {} });

      // Act
      const result = await orchestrator.fetchAll(coordonnees);

      // Assert
      expect(result.sourcesUtilisees).toHaveLength(12);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_RGA);
    });
  });
});
