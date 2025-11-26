import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { UrbanismeEnrichissementService } from "./urbanisme-enrichissement.service";
import { DatagouvLovacService } from "../../adapters/datagouv-lovac/datagouv-lovac.service";
import { OverpassService } from "../../adapters/overpass/overpass.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { LovacData } from "../../adapters/datagouv-lovac/datagouv-lovac.types";
import { Test, TestingModule } from "@nestjs/testing";

describe("UrbanismeEnrichissementService", () => {
  let service: UrbanismeEnrichissementService;
  let lovacService: ReturnType<typeof createMockLovacService>;
  let overpassService: ReturnType<typeof createMockOverpassService>;

  const createMockLovacService = () => ({
    getLovacByCommune: vi.fn(),
  });

  const createMockOverpassService = () => ({
    getDistanceTransportCommun: vi.fn(),
    hasCommercesServices: vi.fn(),
  });

  beforeEach(async () => {
    const mockLovac = createMockLovacService();
    const mockOverpass = createMockOverpassService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrbanismeEnrichissementService,
        { provide: DatagouvLovacService, useValue: mockLovac },
        { provide: OverpassService, useValue: mockOverpass },
      ],
    }).compile();

    service = module.get<UrbanismeEnrichissementService>(UrbanismeEnrichissementService);
    lovacService = mockLovac;
    overpassService = mockOverpass;
  });

  describe("enrichir - LOVAC", () => {
    it("devrait enrichir une parcelle avec les donnees LOVAC et calculer le taux", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 5,
          distancePlusProche: 120,
          categoriesTrouvees: ["SUPERMARCHE", "PHARMACIE", "BOULANGERIE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(parcelle.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });

    it("devrait enrichir avec le nom de commune si pas de code INSEE", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "XXXX000AB0123";
      parcelle.codeInsee = undefined as unknown as string;
      parcelle.commune = "Nantes";
      parcelle.coordonnees = { latitude: 47.2184, longitude: -1.5536 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 12,
          distancePlusProche: 80,
          categoriesTrouvees: ["SUPERMARCHE", "BANQUE", "POSTE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(parcelle.tauxLogementsVacants).toBeCloseTo(4.9, 1);
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: undefined,
        nomCommune: "Nantes",
      });
    });

    it("devrait gerer le cas ou LOVAC ne retourne pas de donnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "99999000AB0123";
      parcelle.codeInsee = "99999";
      parcelle.commune = "Commune Inconnue";
      parcelle.coordonnees = { latitude: 47.0, longitude: -1.0 };

      lovacService.getLovacByCommune.mockResolvedValue(null);

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: false,
          nombreCommercesServices: 0,
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(parcelle.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait gerer le cas ou les donnees LOVAC sont secretisees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "12345000AB0123";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Petite Commune";
      parcelle.coordonnees = { latitude: 47.0, longitude: -1.0 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 2,
          distancePlusProche: 350,
          categoriesTrouvees: ["EPICERIE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(parcelle.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait gerer les erreurs de l'API LOVAC", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      lovacService.getLovacByCommune.mockRejectedValue(new Error("API Error"));

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 8,
          distancePlusProche: 150,
          categoriesTrouvees: ["SUPERMARCHE", "PHARMACIE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(parcelle.tauxLogementsVacants).toBeUndefined();
      // Overpass devrait quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS);
    });

    it("devrait echouer si pas de code INSEE ni de commune", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "XXXX000AB0123";
      parcelle.codeInsee = undefined as unknown as string;
      parcelle.commune = undefined as unknown as string;
      parcelle.coordonnees = { latitude: 47.0, longitude: -1.0 };

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 3,
          distancePlusProche: 200,
          categoriesTrouvees: ["BOULANGERIE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(lovacService.getLovacByCommune).not.toHaveBeenCalled();
    });

    it("devrait prioritiser le code INSEE sur le nom de commune", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 6,
          distancePlusProche: 100,
          categoriesTrouvees: ["SUPERMARCHE"],
        },
        source: "API Overpass",
      });

      // Act
      await service.enrichir(parcelle);

      // Assert
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });
  });

  describe("enrichir - Commerces/Services (Overpass)", () => {
    it("devrait enrichir avec presence de commerces a proximite", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 7,
          distancePlusProche: 85,
          categoriesTrouvees: ["SUPERMARCHE", "PHARMACIE", "BOULANGERIE", "BANQUE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS);
      expect(parcelle.proximiteCommercesServices).toBe(true);
      expect(overpassService.hasCommercesServices).toHaveBeenCalledWith(
        47.4784,
        -0.5632,
        500, // RAYON_RECHERCHE_COMMERCES_M
      );
    });

    it("devrait enrichir avec absence de commerces a proximite", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "RURAL123";
      parcelle.codeInsee = "12345";
      parcelle.commune = "Village Isole";
      parcelle.coordonnees = { latitude: 45.0, longitude: 2.0 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: false,
          nombreCommercesServices: 0,
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS);
      expect(parcelle.proximiteCommercesServices).toBe(false);
    });

    it("devrait gerer l'absence de coordonnees pour Overpass", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = undefined;

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
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.champsManquants).toContain("proximiteCommercesServices");
      expect(parcelle.proximiteCommercesServices).toBeUndefined();
      expect(overpassService.hasCommercesServices).not.toHaveBeenCalled();
    });

    it("devrait gerer les erreurs Overpass", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: false,
        error: "Timeout Overpass API",
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.champsManquants).toContain("proximiteCommercesServices");
      expect(parcelle.proximiteCommercesServices).toBeUndefined();
      // LOVAC devrait quand meme fonctionner
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
    });

    it("devrait gerer les exceptions Overpass", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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
      overpassService.hasCommercesServices.mockRejectedValue(new Error("Network error"));

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.champsManquants).toContain("proximiteCommercesServices");
      expect(parcelle.proximiteCommercesServices).toBeUndefined();
    });
  });

  describe("enrichir - Enrichissement complet", () => {
    it("devrait enrichir completement une parcelle valide", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 10,
          distancePlusProche: 75,
          categoriesTrouvees: ["SUPERMARCHE", "PHARMACIE", "BOULANGERIE", "BANQUE", "POSTE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toHaveLength(2);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.sourcesEchouees).toHaveLength(0);
      expect(result.champsManquants).toHaveLength(0);

      expect(parcelle.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(parcelle.proximiteCommercesServices).toBe(true);
    });

    it("devrait reussir partiellement si LOVAC echoue mais Overpass reussit", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

      lovacService.getLovacByCommune.mockResolvedValue(null);

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 5,
          distancePlusProche: 150,
          categoriesTrouvees: ["SUPERMARCHE", "PHARMACIE"],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(parcelle.proximiteCommercesServices).toBe(true);
      expect(parcelle.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait reussir partiellement si Overpass echoue mais LOVAC reussit", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "49007000AB0123";
      parcelle.codeInsee = "49007";
      parcelle.commune = "Angers";
      parcelle.coordonnees = { latitude: 47.4784, longitude: -0.5632 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: false,
        error: "Rate limit exceeded",
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true); // Succes partiel
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.OVERPASS);
      expect(parcelle.tauxLogementsVacants).toBeCloseTo(7.9, 1);
      expect(parcelle.proximiteCommercesServices).toBeUndefined();
    });

    it("devrait echouer completement si les deux sources echouent", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "XXXX000AB0123";
      parcelle.codeInsee = undefined as unknown as string;
      parcelle.commune = undefined as unknown as string;
      parcelle.coordonnees = undefined;

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(false);
      expect(result.sourcesUtilisees).toHaveLength(0);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.OVERPASS);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(result.champsManquants).toContain("proximiteCommercesServices");
    });
  });

  describe("enrichir - Categories commerces", () => {
    it("devrait detecter plusieurs categories de commerces", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "44109000AB0123";
      parcelle.codeInsee = "44109";
      parcelle.commune = "Nantes";
      parcelle.coordonnees = { latitude: 47.2184, longitude: -1.5536 };

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

      overpassService.hasCommercesServices.mockResolvedValue({
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: 15,
          distancePlusProche: 50,
          categoriesTrouvees: [
            "SUPERMARCHE",
            "EPICERIE",
            "BOULANGERIE",
            "BOUCHERIE",
            "PHARMACIE",
            "MEDECIN",
            "POSTE",
            "BANQUE",
          ],
        },
        source: "API Overpass",
      });

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(parcelle.proximiteCommercesServices).toBe(true);
    });
  });
});
