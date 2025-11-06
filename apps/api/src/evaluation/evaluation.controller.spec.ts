import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, HttpException, HttpStatus } from "@nestjs/common";
import {
  SourceUtilisation,
  TypeProprietaire,
  UsageType,
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
  ZonageReglementaire,
} from "@mutafriches/shared-types";
import { EvaluationController } from "./evaluation.controller";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { createTestingModuleWithService } from "../shared/__test-helpers__/test-module.factory";
import { createMockOrchestrateurService } from "./__test-helpers__/evaluation.mocks";
import { EvaluationBuilder } from "./__test-helpers__/evaluation.builder";

describe("EvaluationController", () => {
  let controller: EvaluationController;
  let orchestrateurService: ReturnType<typeof createMockOrchestrateurService>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockOrchestrateurService = createMockOrchestrateurService();

    mockOrchestrateurService.calculerMutabilite.mockResolvedValue({
      identifiantParcelle: "default",
      usages: [],
      fiabilite: 0,
    });
    mockOrchestrateurService.recupererEvaluation.mockResolvedValue(null);

    const setup = await createTestingModuleWithService(
      EvaluationController,
      OrchestrateurService,
      mockOrchestrateurService,
    );

    controller = setup.controller;
    orchestrateurService = setup.service;
  });

  describe("POST /evaluation/calculer", () => {
    const mockInput = {
      donneesEnrichies: {
        identifiantParcelle: "29232000AB0123",
        codeInsee: "29232",
        commune: "Quimper",
        surfaceSite: 5000,
        sourcesUtilisees: ["cadastre"],
        fiabilite: 9.0,
      },
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

    it("devrait calculer la mutabilite avec options par defaut", async () => {
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

    it("devrait rejeter si donneesEnrichies manquantes", async () => {
      // Arrange
      const invalidInput = { donneesComplementaires: {} } as any;

      // Act & Assert
      try {
        await controller.calculerMutabilite(invalidInput);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = httpError.getResponse() as { message: string; statusCode: number };
        expect(response.message).toBe("Données requises manquantes");
      }
    });

    it("devrait rejeter si input est null", async () => {
      // Act & Assert
      await expect(controller.calculerMutabilite(null as any)).rejects.toThrow(HttpException);
      await expect(controller.calculerMutabilite(null as any)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it("devrait passer modeDetaille=true", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, true);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ modeDetaille: true }),
      );
    });

    it("devrait passer sansEnrichissement=true", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, true);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ sansEnrichissement: true }),
      );
    });

    it("devrait detecter iframe=true depuis query param", async () => {
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

    it("devrait utiliser 'unknown' si iframe=true sans integrateur", async () => {
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

    it("devrait detecter iframe depuis string 'true'", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, false, "true" as any, "partner");

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "partner" },
        }),
      );
    });

    it("devrait propager HttpException du service", async () => {
      // Arrange
      const httpError = new HttpException("Données invalides", HttpStatus.BAD_REQUEST);
      orchestrateurService.calculerMutabilite.mockRejectedValue(httpError);

      // Act & Assert
      await expect(controller.calculerMutabilite(mockInput)).rejects.toThrow(HttpException);
      await expect(controller.calculerMutabilite(mockInput)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it("devrait transformer Error en HttpException 500", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockRejectedValue(new Error("Calcul impossible"));

      // Act & Assert
      try {
        await controller.calculerMutabilite(mockInput);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe("POST /evaluation/calculer - Detection d'origine", () => {
    const mockInput = {
      donneesEnrichies: {
        identifiantParcelle: "29232000AB0123",
        codeInsee: "29232",
        commune: "Quimper",
        surfaceSite: 5000,
        sourcesUtilisees: ["cadastre"],
        fiabilite: 9.0,
      },
      donneesComplementaires: {},
    };

    const mockOutput = {
      identifiantParcelle: "29232000AB0123",
      usages: [],
      fiabilite: 8.5,
    };

    it("devrait detecter API_DIRECTE sans requete", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.API_DIRECTE },
        }),
      );
    });

    it("devrait detecter API_DIRECTE avec referer contenant /api", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = {
        headers: { referer: "https://mutafriches.beta.gouv.fr/api/docs" },
      } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.API_DIRECTE },
        }),
      );
    });

    it("devrait detecter SITE_STANDALONE depuis localhost", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referer: "http://localhost:3000/iframe" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.SITE_STANDALONE },
        }),
      );
    });

    it("devrait detecter SITE_STANDALONE depuis mutafriches.beta.gouv.fr", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referer: "https://mutafriches.beta.gouv.fr/iframe" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.SITE_STANDALONE },
        }),
      );
    });

    it("devrait detecter IFRAME_INTEGREE depuis domaine externe", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referer: "https://cartofriches.fr/map" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "cartofriches.fr" },
      });
    });

    it("devrait extraire integrateur depuis referer", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referer: "https://urbanvitaliz.fr/projects/123" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "urbanvitaliz.fr" },
      });
    });

    it("devrait gerer origin au lieu de referer pour SITE_STANDALONE", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { origin: "http://localhost:3000" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.SITE_STANDALONE },
        }),
      );
    });

    it("devrait gerer origin pour IFRAME_INTEGREE", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { origin: "https://external-site.com" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "external-site.com" },
      });
    });

    it("devrait detecter 127.0.0.1 comme SITE_STANDALONE", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referer: "http://127.0.0.1:3000" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: { source: SourceUtilisation.SITE_STANDALONE },
        }),
      );
    });

    it("devrait gerer referer invalide", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referer: "not-a-valid-url" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({
          origine: {
            source: SourceUtilisation.IFRAME_INTEGREE,
            integrateur: undefined,
          },
        }),
      );
    });

    it("devrait utiliser referrer au lieu de referer", async () => {
      // Arrange
      orchestrateurService.calculerMutabilite.mockResolvedValue(mockOutput);
      const req = { headers: { referrer: "https://example.com" } } as any;

      // Act
      await controller.calculerMutabilite(mockInput, false, false, false, undefined, req);

      // Assert
      expect(orchestrateurService.calculerMutabilite).toHaveBeenCalledWith(mockInput, {
        modeDetaille: false,
        sansEnrichissement: false,
        origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "example.com" },
      });
    });
  });

  describe("GET /evaluation/:id", () => {
    it("devrait recuperer et mapper une evaluation", async () => {
      // Arrange
      const mockEvaluation = new EvaluationBuilder()
        .withId("eval-123")
        .withParcelleId("29232000AB0123")
        .withCodeInsee("29232")
        .withCommune("Quimper")
        .withVersionAlgorithme("1.1.0")
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
        metadata: { versionAlgorithme: "1.1.0", source: "api" },
      });
    });

    it("devrait lancer NotFoundException si evaluation non trouvee", async () => {
      // Arrange
      orchestrateurService.recupererEvaluation.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.recupererEvaluation("unknown-id")).rejects.toThrow(NotFoundException);
      await expect(controller.recupererEvaluation("unknown-id")).rejects.toThrow(
        "Évaluation unknown-id non trouvée",
      );
    });

    it("devrait lancer une erreur si evaluation sans ID", async () => {
      // Arrange
      const evaluationSansId = new EvaluationBuilder().withoutId().build();

      orchestrateurService.recupererEvaluation.mockResolvedValue(evaluationSansId);

      // Act & Assert
      try {
        await controller.recupererEvaluation("eval-123");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        const response = httpError.getResponse() as { message: string; statusCode: number };
        expect(response.message).toBe("Erreur lors de la récupération");
      }
    });

    it("devrait propager NotFoundException", async () => {
      // Arrange
      orchestrateurService.recupererEvaluation.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.recupererEvaluation("eval-456")).rejects.toThrow(NotFoundException);
    });

    it("devrait transformer erreur non-NotFoundException en HttpException 500", async () => {
      // Arrange
      orchestrateurService.recupererEvaluation.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      try {
        await controller.recupererEvaluation("eval-123");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe("GET /evaluation/metadata", () => {
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
        version: { api: "1.0.0", algorithme: "1.1.0" },
      });
    });

    it("devrait retourner les versions correctes", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.version.api).toBe("1.0.0");
      expect(result.version.algorithme).toBe("1.1.0");
    });

    it("devrait inclure tous les enums enrichissement", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.enums.enrichissement.risqueNaturel).toContain(RisqueNaturel.AUCUN);
      expect(result.enums.enrichissement.zonageEnvironnemental).toContain(
        ZonageEnvironnemental.HORS_ZONE,
      );
    });

    it("devrait inclure tous les enums saisie", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.enums.saisie.typeProprietaire).toContain(TypeProprietaire.PRIVE);
      expect(result.enums.saisie.raccordementEau).toContain(RaccordementEau.OUI);
    });

    it("devrait inclure tous les usages", () => {
      // Act
      const result = controller.getMetadata();

      // Assert
      expect(result.enums.usages).toContain(UsageType.RESIDENTIEL);
      expect(result.enums.usages).toContain(UsageType.TERTIAIRE);
    });
  });
});
