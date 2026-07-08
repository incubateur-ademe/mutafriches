import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { UrbanismeEnrichissementService } from "./urbanisme-enrichissement.service";
import { DatagouvZonageAbcService } from "../../adapters/datagouv-zonage-abc/datagouv-zonage-abc.service";
import { BpeRepository } from "../../repositories/bpe.repository";
import { LovacRepository, LovacCommuneData } from "../../repositories/lovac.repository";
import { Site } from "../../../evaluation/entities/site.entity";
import { Test, TestingModule } from "@nestjs/testing";

describe("UrbanismeEnrichissementService", () => {
  let service: UrbanismeEnrichissementService;
  let lovacRepository: ReturnType<typeof createMockLovacRepository>;
  let zonageAbcService: ReturnType<typeof createMockZonageAbcService>;
  let bpeRepository: ReturnType<typeof createMockBpeRepository>;

  const createMockLovacRepository = () => ({
    findByCommune: vi.fn(),
  });

  const createMockZonageAbcService = () => ({
    getZonageByCommune: vi.fn(),
  });

  const createMockBpeRepository = () => ({
    findCommercesServicesProximite: vi.fn(),
  });

  beforeEach(async () => {
    const mockLovac = createMockLovacRepository();
    const mockZonageAbc = createMockZonageAbcService();
    const mockBpe = createMockBpeRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrbanismeEnrichissementService,
        { provide: LovacRepository, useValue: mockLovac },
        { provide: DatagouvZonageAbcService, useValue: mockZonageAbc },
        { provide: BpeRepository, useValue: mockBpe },
      ],
    }).compile();

    service = module.get<UrbanismeEnrichissementService>(UrbanismeEnrichissementService);
    lovacRepository = mockLovac;
    zonageAbcService = mockZonageAbc;
    bpeRepository = mockBpe;
  });

  describe("enrichir - LOVAC", () => {
    it("devrait enrichir un site avec les donnees LOVAC et calculer le taux", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 5,
        distancePlusProche: 120,
        categoriesTrouvees: ["B105", "D307", "B207"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(site.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(lovacRepository.findByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });

    it("devrait enrichir avec le nom de commune si pas de code INSEE", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "XXXX000AB0123";
      site.codeInsee = undefined as unknown as string;
      site.commune = "Nantes";
      site.coordonnees = { latitude: 47.2184, longitude: -1.5536 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "44109",
        commune: "Nantes",
        nombreLogementsTotal: 171234,
        nombreLogementsVacants: 8456,
        nombreLogementsVacantsPlus2ans: 5234,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 12,
        distancePlusProche: 80,
        categoriesTrouvees: ["B105", "A203", "A206"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(site.tauxLogementsVacants).toBeCloseTo(4.9, 1);
      expect(lovacRepository.findByCommune).toHaveBeenCalledWith({
        codeInsee: undefined,
        nomCommune: "Nantes",
      });
    });

    it("devrait gerer le cas ou LOVAC ne retourne pas de donnees", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "99999000AB0123";
      site.codeInsee = "99999";
      site.commune = "Commune Inconnue";
      site.coordonnees = { latitude: 47.0, longitude: -1.0 };

      lovacRepository.findByCommune.mockResolvedValue(null);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: false,
        nombreCommercesServices: 0,
        distancePlusProche: null,
        categoriesTrouvees: [],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(site.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait gerer le cas ou les donnees LOVAC sont secretisees", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "12345000AB0123";
      site.codeInsee = "12345";
      site.commune = "Petite Commune";
      site.coordonnees = { latitude: 47.0, longitude: -1.0 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "12345",
        commune: "Petite Commune",
        nombreLogementsTotal: null,
        nombreLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: null,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 2,
        distancePlusProche: 350,
        categoriesTrouvees: ["B202"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(site.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait gerer les erreurs de lecture LOVAC", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      lovacRepository.findByCommune.mockRejectedValue(new Error("DB Error"));

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 8,
        distancePlusProche: 150,
        categoriesTrouvees: ["B105", "D307"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(site.tauxLogementsVacants).toBeUndefined();
      // BPE devrait quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BPE);
    });

    it("devrait echouer si pas de code INSEE ni de commune", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "XXXX000AB0123";
      site.codeInsee = undefined as unknown as string;
      site.commune = undefined as unknown as string;
      site.coordonnees = { latitude: 47.0, longitude: -1.0 };

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 3,
        distancePlusProche: 200,
        categoriesTrouvees: ["B207"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(lovacRepository.findByCommune).not.toHaveBeenCalled();
    });

    it("devrait prioritiser le code INSEE sur le nom de commune", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 6,
        distancePlusProche: 100,
        categoriesTrouvees: ["B105"],
      });

      // Act
      await service.enrichir(site);

      // Assert
      expect(lovacRepository.findByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });
  });

  describe("enrichir - Commerces/Services (BPE)", () => {
    it("devrait enrichir avec presence de commerces a proximite", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 7,
        distancePlusProche: 85,
        categoriesTrouvees: ["B105", "D307", "B207", "A203"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BPE);
      expect(site.proximiteCommercesServices).toBe(true);
      expect(bpeRepository.findCommercesServicesProximite).toHaveBeenCalledWith(
        47.4784,
        -0.5632,
        500, // RAYON_RECHERCHE_COMMERCES_M
      );
    });

    it("devrait enrichir avec absence de commerces a proximite", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "RURAL123";
      site.codeInsee = "12345";
      site.commune = "Village Isole";
      site.coordonnees = { latitude: 45.0, longitude: 2.0 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "12345",
        commune: "Village Isole",
        nombreLogementsTotal: 500,
        nombreLogementsVacants: 25,
        nombreLogementsVacantsPlus2ans: 10,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: false,
        nombreCommercesServices: 0,
        distancePlusProche: null,
        categoriesTrouvees: [],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BPE);
      expect(site.proximiteCommercesServices).toBe(false);
    });

    it("devrait gerer l'absence de coordonnees pour BPE", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = undefined;

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.BPE);
      expect(result.champsManquants).toContain("proximiteCommercesServices");
      expect(site.proximiteCommercesServices).toBeUndefined();
      expect(bpeRepository.findCommercesServicesProximite).not.toHaveBeenCalled();
    });

    it("devrait gerer les erreurs BPE", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);
      bpeRepository.findCommercesServicesProximite.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.BPE);
      expect(result.champsManquants).toContain("proximiteCommercesServices");
      expect(site.proximiteCommercesServices).toBeUndefined();
      // LOVAC devrait quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
    });
  });

  describe("enrichir - Enrichissement complet", () => {
    it("devrait enrichir completement un site valide", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);

      zonageAbcService.getZonageByCommune.mockResolvedValue({
        codeInsee: "49007",
        commune: "Angers",
        zonage: "b1",
      });

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 10,
        distancePlusProche: 75,
        categoriesTrouvees: ["B105", "D307", "B207", "A203", "A206"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toHaveLength(3);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ZONAGE_ABC_LOGEMENT);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BPE);
      expect(result.sourcesEchouees).toHaveLength(0);
      expect(result.champsManquants).toHaveLength(0);

      expect(site.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(site.proximiteCommercesServices).toBe(true);
    });

    it("devrait reussir partiellement si LOVAC echoue mais BPE reussit", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      lovacRepository.findByCommune.mockResolvedValue(null);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 5,
        distancePlusProche: 150,
        categoriesTrouvees: ["B105", "D307"],
      });

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BPE);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(site.proximiteCommercesServices).toBe(true);
      expect(site.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait reussir partiellement si BPE echoue mais LOVAC reussit", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacCommuneData = {
        codeInsee: "49007",
        commune: "Angers",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2026,
      };

      lovacRepository.findByCommune.mockResolvedValue(mockLovacData);
      bpeRepository.findCommercesServicesProximite.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.BPE);
      expect(site.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(site.proximiteCommercesServices).toBeUndefined();
    });

    it("devrait echouer completement si les deux sources echouent", async () => {
      // Arrange
      const site = new Site();
      site.identifiantParcelle = "XXXX000AB0123";
      site.codeInsee = undefined as unknown as string;
      site.commune = undefined as unknown as string;
      site.coordonnees = undefined;

      // Act
      const result = await service.enrichir(site);

      // Assert
      expect(result.success).toBe(false);
      expect(result.sourcesUtilisees).toHaveLength(0);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.BPE);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(result.champsManquants).toContain("proximiteCommercesServices");
    });
  });
});
