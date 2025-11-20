import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import {
  SourceUtilisation,
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  UsageType,
  ZonageReglementaire,
  VERSION_ALGO,
} from "@mutafriches/shared-types";
import { FrichesController } from "./friches.controller";
import { EnrichissementService } from "../enrichissement/services/enrichissement.service";
import { OrchestrateurService } from "../evaluation/services/orchestrateur.service";
import { createMockEnrichissementService } from "../enrichissement/__test-helpers__/enrichissement.mocks";
import { createMockOrchestrateurService } from "../evaluation/__test-helpers__/evaluation.mocks";
import { EvaluationBuilder } from "../evaluation/__test-helpers__/evaluation.builder";
import packageJson from "./../../../../package.json";

describe("FrichesController", () => {
  let controller: FrichesController;
  let enrichissementService: ReturnType<typeof createMockEnrichissementService>;
  let orchestrateurService: ReturnType<typeof createMockOrchestrateurService>;

  beforeEach(async () => {
    const mockEnrichissement = createMockEnrichissementService();
    const mockOrchestrateur = createMockOrchestrateurService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FrichesController],
      providers: [
        { provide: EnrichissementService, useValue: mockEnrichissement },
        { provide: OrchestrateurService, useValue: mockOrchestrateur },
      ],
    }).compile();

    controller = module.get<FrichesController>(FrichesController);
    enrichissementService = mockEnrichissement;
    orchestrateurService = mockOrchestrateur;
  });

  describe("POST /friches/enrichir", () => {
    it("devrait appeler enrichissementService.enrichir avec l'identifiant", async () => {
      // Arrange
      const input = { identifiant: "29232000AB0123" };
      const mockOutput = {
        identifiantParcelle: "29232000AB0123",
        codeInsee: "29232",
        commune: "Quimper",
        surfaceSite: 1000,
        sourcesUtilisees: ["cadastre"],
        fiabilite: 9.5,
      };
      enrichissementService.enrichir.mockResolvedValue(mockOutput);

      // Act
      const result = await controller.enrichirParcelle(input);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith("29232000AB0123");
      expect(result).toEqual(mockOutput);
    });

    it("devrait propager les erreurs du service", async () => {
      // Arrange
      const input = { identifiant: "INVALID" };
      enrichissementService.enrichir.mockRejectedValue(new Error("Parcelle introuvable"));

      // Act & Assert
      await expect(controller.enrichirParcelle(input)).rejects.toThrow("Parcelle introuvable");
    });
  });

  describe("POST /friches/calculer", () => {
    const mockInput = {
      identifiantParcelle: "29232000AB0123",
      donneesComplementaires: {
        typeProprietaire: TypeProprietaire.PRIVE,
        surfaceSite: 5000,
      },
    };

    const mockOutput = {
      identifiantParcelle: "29232000AB0123",
      usages: [
        { usage: UsageType.RESIDENTIEL, indice: 75, rang: 1 },
        { usage: UsageType.TERTIAIRE, indice: 60, rang: 2 },
      ],
      fiabilite: 8.5,
    };

    it("devrait appeler orchestrateurService avec les options par defaut", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      const result = await controller.calculerMutabilite(mockInput);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.API_DIRECTE },
      });
      expect(result).toEqual(mockOutput);
    });

    it("devrait passer modeDetaille=true quand specifie", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, true);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: true,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.API_DIRECTE },
      });
    });

    it("devrait passer sansEnrichissement=true quand specifie", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, true);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: true,
        origine: { source: SourceUtilisation.API_DIRECTE },
      });
    });

    it("devrait detecter le mode iframe quand iframe=true", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, false, true);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "unknown" },
      });
    });

    it("devrait passer l'integrateur quand specifie en mode iframe", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, false, true, "cartofriches");

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "cartofriches" },
      });
    });

    it("devrait utiliser API_DIRECTE si iframe=false", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, "cartofriches");

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.API_DIRECTE },
      });
    });

    it("devrait gerer iframe comme string 'true'", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, false, "true" as any, "cartofriches");

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "cartofriches" },
      });
    });

    it("devrait propager les erreurs du service", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockRejectedValue(new Error("Calcul impossible"));

      // Act & Assert
      await expect(controller.calculerMutabilite(mockInput)).rejects.toThrow("Calcul impossible");
    });
  });

  describe("GET /friches/evaluations/:id", () => {
    it("devrait retourner l'evaluation mappee", async () => {
      // Arrange
      const mockEvaluation = new EvaluationBuilder()
        .withId("eval-123")
        .withParcelleId("29232000AB0123")
        .withEnrichissement({
          identifiantParcelle: "29232000AB0123",
          codeInsee: "29232",
          commune: "Quimper",
          surfaceSite: 5000,
          sourcesUtilisees: ["cadastre"],
          fiabilite: 9.0,
        })
        .withDonneesComplementaires({
          typeProprietaire: TypeProprietaire.PRIVE,
        })
        .withResultats({
          fiabilite: {
            note: 8.5,
            text: "Fiable",
            description: "Calcul basé sur des données complètes",
            criteresRenseignes: 15,
            criteresTotal: 18,
          },
          resultats: [
            {
              usage: UsageType.RESIDENTIEL,
              indiceMutabilite: 75,
              rang: 1,
              potentiel: "Favorable",
            },
          ],
        })
        .build();

      orchestrateurService.recupererEvaluation.mockResolvedValue(mockEvaluation);

      // Act
      const result = await controller.recupererEvaluation("eval-123");

      // Assert
      expect(orchestrateurService.recupererEvaluation).toHaveBeenCalledWith("eval-123");
      expect(result).toEqual({
        id: "eval-123",
        identifiantParcelle: "29232000AB0123",
        dateCreation: mockEvaluation.dateCalcul,
        dateModification: mockEvaluation.dateCalcul,
        enrichissement: mockEvaluation.donneesEnrichissement,
        donneesComplementaires: mockEvaluation.donneesComplementaires,
        mutabilite: mockEvaluation.resultats,
        metadata: {
          versionAlgorithme: VERSION_ALGO,
          source: "api",
        },
      });
    });

    it("devrait lancer NotFoundException si evaluation non trouvee", async () => {
      // Arrange
      orchestrateurService.recupererEvaluation.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.recupererEvaluation("unknown-id")).rejects.toThrow(NotFoundException);
    });

    it("devrait lancer une erreur si l'evaluation n'a pas d'ID", async () => {
      // Arrange
      const evaluationSansId = new EvaluationBuilder()
        .withoutId()
        .withParcelleId("29232000AB0123")
        .build();

      orchestrateurService.recupererEvaluation.mockResolvedValue(evaluationSansId);

      // Act & Assert
      await expect(controller.recupererEvaluation("eval-123")).rejects.toThrow(
        "Evaluation ID missing",
      );
    });
  });

  describe("GET /friches/metadata", () => {
    it("devrait retourner les metadonnees completes", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result).toEqual({
        enums: {
          enrichissement: {
            risqueNaturel: Object.values(RisqueNaturel),
            zonageEnvironnemental: Object.values(ZonageEnvironnemental),
            zonageReglementaire: Object.values(ZonageReglementaire),
            zonagePatrimonial: Object.values(ZonagePatrimonial),
            trameVerteEtBleue: Object.values(TrameVerteEtBleue),
          },
          saisie: {
            typeProprietaire: Object.values(TypeProprietaire),
            raccordementEau: Object.values(RaccordementEau),
            etatBatiInfrastructure: Object.values(EtatBatiInfrastructure),
            presencePollution: Object.values(PresencePollution),
            valeurArchitecturaleHistorique: Object.values(ValeurArchitecturale),
            qualitePaysage: Object.values(QualitePaysage),
            qualiteVoieDesserte: Object.values(QualiteVoieDesserte),
          },
          usages: Object.values(UsageType),
        },
        version: { api: packageJson.version, algorithme: VERSION_ALGO },
      });
    });

    it("devrait retourner toutes les valeurs d'enums enrichissement", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.enums.enrichissement.risqueNaturel).toContain(RisqueNaturel.AUCUN);
      expect(result.enums.enrichissement.risqueNaturel).toContain(RisqueNaturel.FAIBLE);
      expect(result.enums.enrichissement.zonageEnvironnemental).toContain(
        ZonageEnvironnemental.HORS_ZONE,
      );
    });

    it("devrait retourner toutes les valeurs d'enums saisie", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.enums.saisie.typeProprietaire).toContain(TypeProprietaire.PRIVE);
      expect(result.enums.saisie.typeProprietaire).toContain(TypeProprietaire.PUBLIC);
      expect(result.enums.saisie.raccordementEau).toContain(RaccordementEau.OUI);
    });

    it("devrait retourner tous les types d'usages", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.enums.usages).toContain(UsageType.RESIDENTIEL);
      expect(result.enums.usages).toContain(UsageType.TERTIAIRE);
      expect(result.enums.usages).toContain(UsageType.INDUSTRIE);
    });

    it("devrait retourner les versions correctes", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.version.api).toBe(packageJson.version);
      expect(result.version.algorithme).toBe(VERSION_ALGO);
    });
  });
});
