import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { UrbanismeEnrichissementService } from "./urbanisme-enrichissement.service";
import { DatagouvLovacService } from "../../adapters/datagouv-lovac/datagouv-lovac.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { LovacData } from "../../adapters/datagouv-lovac/datagouv-lovac.types";

describe("UrbanismeEnrichissementService", () => {
  let service: UrbanismeEnrichissementService;
  let lovacService: ReturnType<typeof createMockLovacService>;

  const createMockLovacService = () => ({
    getLovacByCommune: vi.fn(),
  });

  beforeEach(async () => {
    const mockLovac = createMockLovacService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrbanismeEnrichissementService,
        { provide: DatagouvLovacService, useValue: mockLovac },
      ],
    }).compile();

    service = module.get<UrbanismeEnrichissementService>(UrbanismeEnrichissementService);
    lovacService = mockLovac;
  });

  describe("enrichir", () => {
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
        tauxLogementsVacants: null, // L'adapter ne calcule plus, c'est le calculator qui le fait
        nombreLogementsVacantsPlus2ans: 4123,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.LOVAC);
      expect(parcelle.tauxLogementsVacants).toBeCloseTo(7.9, 1); // Calculé par LovacCalculator
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined,
      });
    });

    it("devrait enrichir avec le nom de commune si pas de code INSEE", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "XXXX000AB0123";
      parcelle.codeInsee = undefined as any;
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
        nombreLogementsTotal: null, // Secrétisé
        nombreLogementsVacants: null, // Secrétisé
        tauxLogementsVacants: null,
        nombreLogementsVacantsPlus2ans: null,
        millesime: 2025,
      };

      lovacService.getLovacByCommune.mockResolvedValue(mockLovacData);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert - Données non exploitables détectées par LovacCalculator.sontDonneesExploitables
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

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(parcelle.tauxLogementsVacants).toBeUndefined();
    });

    it("devrait echouer si pas de code INSEE ni de commune", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "XXXX000AB0123";
      parcelle.codeInsee = undefined as any;
      parcelle.commune = undefined as any;
      parcelle.coordonnees = { latitude: 47.0, longitude: -1.0 };

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesEchouees).toContain(SourceEnrichissement.LOVAC);
      expect(result.champsManquants).toContain("tauxLogementsVacants");
      expect(lovacService.getLovacByCommune).not.toHaveBeenCalled();
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
    });

    it("devrait utiliser les donnees temporaires pour commerces/services", async () => {
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

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.sourcesUtilisees).toContain(SourceEnrichissement.OVERPASS_TEMPORAIRE);
      expect(parcelle.proximiteCommercesServices).toBeDefined();
      expect(typeof parcelle.proximiteCommercesServices).toBe("boolean");
    });

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

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcesUtilisees).toHaveLength(2); // LOVAC + OVERPASS_TEMPORAIRE
      expect(result.sourcesEchouees).toHaveLength(0);
      expect(result.champsManquants).toHaveLength(0);

      expect(parcelle.tauxLogementsVacants).toBeCloseTo(7.9, 1); // Calculé par LovacCalculator
      expect(parcelle.proximiteCommercesServices).toBeDefined();
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

      // Act
      await service.enrichir(parcelle);

      // Assert
      expect(lovacService.getLovacByCommune).toHaveBeenCalledWith({
        codeInsee: "49007",
        nomCommune: undefined, // Le nom de commune ne doit pas être utilisé si codeInsee est présent
      });
    });
  });
});
