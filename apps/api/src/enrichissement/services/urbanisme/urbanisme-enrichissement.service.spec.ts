import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { UrbanismeEnrichissementService } from "./urbanisme-enrichissement.service";
import { DatagouvLovacService } from "../../adapters/datagouv-lovac/datagouv-lovac.service";
import { BpeRepository } from "../../repositories/bpe.repository";
import { Site } from "../../../evaluation/entities/site.entity";
import { LovacData } from "../../adapters/datagouv-lovac/datagouv-lovac.types";
import { Test, TestingModule } from "@nestjs/testing";

describe("UrbanismeEnrichissementService", () => {
  let service: UrbanismeEnrichissementService;
  let lovacService: ReturnType<typeof createMockLovacService>;
  let bpeRepository: ReturnType<typeof createMockBpeRepository>;

  const createMockLovacService = () => ({
    getLovacByCommune: vi.fn(),
  });

  const createMockBpeRepository = () => ({
    findCommercesServicesProximite: vi.fn(),
  });

  beforeEach(async () => {
    const mockLovac = createMockLovacService();
    const mockBpe = createMockBpeRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrbanismeEnrichissementService,
        { provide: DatagouvLovacService, useValue: mockLovac },
        { provide: BpeRepository, useValue: mockBpe },
      ],
    }).compile();

    service = module.get<UrbanismeEnrichissementService>(UrbanismeEnrichissementService);
    lovacService = mockLovac;
    bpeRepository = mockBpe;
  });

  describe("enrichir - LOVAC", () => {
    it("devrait enrichir un site avec les donnees LOVAC et calculer le taux", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });

    it("devrait enrichir avec le nom de commune si pas de code INSEE", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "XXXX000AB0123";
      site.codeInsee = undefined as unknown as string;
      site.commune = "Nantes";
      site.coordonnees = { latitude: 47.2184, longitude: -1.5536 };

      const mockLovacData: LovacData = {
        codeInsee: "44109",
        commune: "Nantes",
        departement: "Loire-Atlantique",
        region: "Pays de la Loire",
        nombreLogementsTotal: 171234,
        nombreLogementsVacants: 8456,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 5234,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: undefined,
        nomCommune: "Nantes",
      });
    });

    it("devrait gerer le cas ou LOVAC ne retourne pas de donnees", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "99999000AB0123";
      site.codeInsee = "99999";
      site.commune = "Commune Inconnue";
      site.coordonnees = { latitude: 47.0, longitude: -1.0 };

      lovacService.getLovacByCommune.mockResolvedValue(null);

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
      const site =new Site();
      site.identifiantParcelle = "12345000AB0123";
      site.codeInsee = "12345";
      site.commune = "Petite Commune";
      site.coordonnees = { latitude: 47.0, longitude: -1.0 };

      const mockLovacData: LovacData = {
        codeInsee: "12345",
        commune: "Petite Commune",
        departement: "Test",
        region: "Test Region",
        nombreLogementsTotal: null,
        nombreLogementsVacants: null,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: null,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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

    it("devrait gerer les erreurs de l'API LOVAC", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      lovacService.getLovacByCommune.mockRejectedValue(new Error("API Error"));

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
      const site =new Site();
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
      expect(lovacService.getLovacByCommune).not.toHaveBeenCalled();
    });

    it("devrait prioritiser le code INSEE sur le nom de commune", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

      bpeRepository.findCommercesServicesProximite.mockResolvedValue({
        presenceCommercesServices: true,
        nombreCommercesServices: 6,
        distancePlusProche: 100,
        categoriesTrouvees: ["B105"],
      });

      // Act
      await service.enrichir(site);

      // Assert
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });
  });

  describe("enrichir - Commerces/Services (BPE)", () => {
    it("devrait enrichir avec presence de commerces a proximite", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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
      const site =new Site();
      site.identifiantParcelle = "RURAL123";
      site.codeInsee = "12345";
      site.commune = "Village Isole";
      site.coordonnees = { latitude: 45.0, longitude: 2.0 };

      const mockLovacData: LovacData = {
        codeInsee: "12345",
        commune: "Village Isole",
        departement: "Test",
        region: "Test Region",
        nombreLogementsTotal: 500,
        nombreLogementsVacants: 25,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 10,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = undefined;

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);
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
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

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
      expect(result.sourcesUtilisees).toHaveLength(2);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.BPE);
      expect(result.sourcesEchouees).toHaveLength(0);
      expect(result.champsManquants).toHaveLength(0);

      expect(site.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(site.proximiteCommercesServices).toBe(true);
    });

    it("devrait reussir partiellement si LOVAC echoue mais BPE reussit", async () => {
      // Arrange
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      lovacService.getLovacByCommune.mockResolvedValue(null);

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
      const site =new Site();
      site.identifiantParcelle = "49007000AB0123";
      site.codeInsee = "49007";
      site.commune = "Angers";
      site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      const mockLovacData: LovacData = {
        codeInsee: "49007",
        commune: "Angers",
        departement: "Maine-et-Loire",
        region: "Pays de la Loire",
        nombreLogementsTotal: 86234,
        nombreLogementsVacants: 6789,
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);
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
      const site =new Site();
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
