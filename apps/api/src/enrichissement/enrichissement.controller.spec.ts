import { describe, it, expect, beforeEach } from "vitest";
import { HttpException, HttpStatus } from "@nestjs/common";
import { SourceUtilisation } from "@mutafriches/shared-types";
import { EnrichissementController } from "./enrichissement.controller";
import { EnrichissementService } from "./services/enrichissement.service";
import { OrigineDetectionService } from "../shared/services/origine-detection.service";
import { createTestingModuleWithTwoServices } from "../shared/__test-helpers__/test-module.factory";
import { createMockEnrichissementService } from "./__test-helpers__/enrichissement.mocks";
import { createMockOrigineDetectionService } from "../shared/__test-helpers__/origine-detection.mocks";

describe("EnrichissementController", () => {
  let controller: EnrichissementController;
  let enrichissementService: ReturnType<typeof createMockEnrichissementService>;
  let origineDetectionService: ReturnType<typeof createMockOrigineDetectionService>;

  beforeEach(async () => {
    const mockEnrichissementService = createMockEnrichissementService();
    const mockOrigineDetectionService = createMockOrigineDetectionService();

    const setup = await createTestingModuleWithTwoServices(
      EnrichissementController,
      EnrichissementService,
      mockEnrichissementService,
      OrigineDetectionService,
      mockOrigineDetectionService,
    );

    controller = setup.controller;
    enrichissementService = setup.service1 as ReturnType<typeof createMockEnrichissementService>;
    origineDetectionService = setup.service2 as ReturnType<
      typeof createMockOrigineDetectionService
    >;
  });

  describe("POST /enrichissement", () => {
    const mockInput = { identifiant: "29232000AB0123" };

    const mockOutput = {
      identifiantParcelle: "29232000AB0123",
      codeInsee: "29232",
      commune: "Quimper",
      surfaceSite: 5000,
      surfaceBati: 1000,
      coordonnees: { latitude: 48.0, longitude: -4.0 },
      sourcesUtilisees: ["cadastre", "enedis", "transport"],
      champsManquants: [],
      fiabilite: 9.5,
    };

    it("devrait enrichir une parcelle avec succes", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);

      // Act
      const result = await controller.enrichirParcelle(mockInput);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith(
        "29232000AB0123",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
      expect(result).toEqual(mockOutput);
    });

    it("devrait appeler le service avec l'identifiant correct", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);
      const customInput = { identifiant: "75101000AB9999" };

      // Act
      await controller.enrichirParcelle(customInput);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith(
        "75101000AB9999",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
      expect(enrichissementService.enrichir).toHaveBeenCalledTimes(1);
    });

    it("devrait retourner les donnees enrichies completes", async () => {
      // Arrange
      const detailedOutput = {
        ...mockOutput,
        distanceRaccordementElectrique: 500,
        distanceTransportCommun: 200,
        siteEnCentreVille: true,
        presenceRisquesNaturels: "FAIBLE",
        presenceRisquesTechnologiques: false,
      };
      enrichissementService.enrichir.mockResolvedValue(detailedOutput);

      // Act
      const result = await controller.enrichirParcelle(mockInput);

      // Assert
      expect(result).toEqual(detailedOutput);
      expect(result.distanceRaccordementElectrique).toBe(500);
      expect(result.siteEnCentreVille).toBe(true);
    });

    it("devrait propager HttpException du service", async () => {
      // Arrange
      const httpError = new HttpException("Parcelle introuvable", HttpStatus.NOT_FOUND);
      enrichissementService.enrichir.mockRejectedValue(httpError);

      // Act & Assert
      await expect(controller.enrichirParcelle(mockInput)).rejects.toThrow(HttpException);
      await expect(controller.enrichirParcelle(mockInput)).rejects.toMatchObject({
        message: "Parcelle introuvable",
        status: HttpStatus.NOT_FOUND,
      });
    });

    it("devrait transformer Error standard en HttpException 500", async () => {
      // Arrange
      const standardError = new Error("Service externe indisponible");
      enrichissementService.enrichir.mockRejectedValue(standardError);

      // Act & Assert
      try {
        await controller.enrichirParcelle(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(httpError.getResponse()).toEqual({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Service externe indisponible",
        });
      }
    });

    it("devrait gerer les erreurs non-Error avec message generique", async () => {
      // Arrange
      enrichissementService.enrichir.mockRejectedValue("String error");

      // Act & Assert
      try {
        await controller.enrichirParcelle(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(httpError.getResponse()).toEqual({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Une erreur est survenue",
        });
      }
    });

    it("devrait gerer HttpException BAD_REQUEST", async () => {
      // Arrange
      const badRequestError = new HttpException(
        "Format d'identifiant invalide",
        HttpStatus.BAD_REQUEST,
      );
      enrichissementService.enrichir.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.enrichirParcelle(mockInput)).rejects.toThrow(HttpException);
      await expect(controller.enrichirParcelle(mockInput)).rejects.toMatchObject({
        message: "Format d'identifiant invalide",
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it("devrait gerer un enrichissement partiel", async () => {
      // Arrange
      const partialOutput = {
        ...mockOutput,
        sourcesUtilisees: ["cadastre"],
        champsManquants: ["distanceTransportCommun", "siteEnCentreVille"],
        fiabilite: 6.5,
      };
      enrichissementService.enrichir.mockResolvedValue(partialOutput);

      // Act
      const result = await controller.enrichirParcelle(mockInput);

      // Assert
      expect(result.sourcesUtilisees).toHaveLength(1);
      expect(result.champsManquants).toHaveLength(2);
      expect(result.fiabilite).toBe(6.5);
    });

    it("devrait gerer plusieurs appels successifs", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);

      // Act
      await controller.enrichirParcelle({ identifiant: "29232000AB0001" });
      await controller.enrichirParcelle({ identifiant: "29232000AB0002" });
      await controller.enrichirParcelle({ identifiant: "29232000AB0003" });

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledTimes(3);
      expect(enrichissementService.enrichir).toHaveBeenNthCalledWith(
        1,
        "29232000AB0001",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
      expect(enrichissementService.enrichir).toHaveBeenNthCalledWith(
        2,
        "29232000AB0002",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
      expect(enrichissementService.enrichir).toHaveBeenNthCalledWith(
        3,
        "29232000AB0003",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
    });

    it("devrait retourner geometrie si presente", async () => {
      // Arrange
      const outputWithGeometry = {
        ...mockOutput,
        geometrie: {
          type: "Polygon",
          coordinates: [
            [
              [48.0, -4.0],
              [48.1, -4.0],
              [48.1, -4.1],
              [48.0, -4.1],
              [48.0, -4.0],
            ],
          ],
        },
      };
      enrichissementService.enrichir.mockResolvedValue(outputWithGeometry);

      // Act
      const result = await controller.enrichirParcelle(mockInput);

      // Assert
      expect(result.geometrie).toBeDefined();
      expect(result.geometrie?.type).toBe("Polygon");
    });

    it("devrait gerer un identifiant avec espaces", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);
      const inputWithSpaces = { identifiant: " 29232000AB0123 " };

      // Act
      await controller.enrichirParcelle(inputWithSpaces);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith(
        " 29232000AB0123 ",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
    });

    it("devrait gerer timeout du service", async () => {
      // Arrange
      const timeoutError = new Error("Timeout de 30 secondes depassé");
      enrichissementService.enrichir.mockRejectedValue(timeoutError);

      // Act & Assert
      try {
        await controller.enrichirParcelle(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(httpError.getResponse()).toMatchObject({
          message: "Timeout de 30 secondes depassé",
        });
      }
    });

    it("devrait retourner risquesGeorisques si present", async () => {
      // Arrange
      const outputWithGeorisques = {
        ...mockOutput,
        risquesGeorisques: {
          rga: { niveau: "FAIBLE", details: {} },
          tri: { niveau: "MOYEN", details: {} },
          metadata: {
            sourcesUtilisees: ["rga", "tri"],
            sourcesEchouees: [],
            fiabilite: 10,
          },
        },
      };
      enrichissementService.enrichir.mockResolvedValue(outputWithGeorisques);

      // Act
      const result = await controller.enrichirParcelle(mockInput);

      // Assert
      expect(result.risquesGeorisques).toBeDefined();
      expect(result.risquesGeorisques?.rga).toBeDefined();
      expect(result.risquesGeorisques?.tri).toBeDefined();
    });
  });

  describe("Gestion des erreurs - Types specifiques", () => {
    const mockInput = { identifiant: "29232000AB0123" };

    it("devrait gerer HttpException CONFLICT", async () => {
      // Arrange
      const conflictError = new HttpException("Ressource deja existante", HttpStatus.CONFLICT);
      enrichissementService.enrichir.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.enrichirParcelle(mockInput)).rejects.toThrow(HttpException);
      await expect(controller.enrichirParcelle(mockInput)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });

    it("devrait gerer HttpException SERVICE_UNAVAILABLE", async () => {
      // Arrange
      const unavailableError = new HttpException(
        "Service temporairement indisponible",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      enrichissementService.enrichir.mockRejectedValue(unavailableError);

      // Act & Assert
      await expect(controller.enrichirParcelle(mockInput)).rejects.toThrow(HttpException);
      await expect(controller.enrichirParcelle(mockInput)).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it("devrait gerer Error avec message vide", async () => {
      // Arrange
      const emptyError = new Error("");
      enrichissementService.enrichir.mockRejectedValue(emptyError);

      // Act & Assert
      try {
        await controller.enrichirParcelle(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getResponse()).toMatchObject({
          message: "",
        });
      }
    });

    it("devrait gerer null comme erreur", async () => {
      // Arrange
      enrichissementService.enrichir.mockRejectedValue(null);

      // Act & Assert
      try {
        await controller.enrichirParcelle(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getResponse()).toMatchObject({
          message: "Une erreur est survenue",
        });
      }
    });

    it("devrait gerer undefined comme erreur", async () => {
      // Arrange
      enrichissementService.enrichir.mockRejectedValue(undefined);

      // Act & Assert
      try {
        await controller.enrichirParcelle(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getResponse()).toMatchObject({
          message: "Une erreur est survenue",
        });
      }
    });
  });

  describe("POST /enrichissement - Detection d'origine", () => {
    const mockInput = { identifiant: "29232000AB0123" };
    const mockOutput = {
      identifiantParcelle: "29232000AB0123",
      codeInsee: "29232",
      commune: "Quimper",
      surfaceSite: 5000,
      surfaceBati: 1000,
      coordonnees: { latitude: 48.0, longitude: -4.0 },
      sourcesUtilisees: ["cadastre"],
      champsManquants: [],
      fiabilite: 9.5,
    };

    it("devrait appeler le service de detection avec les parametres corrects", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);
      const req = { headers: {} } as any;

      // Act
      await controller.enrichirParcelle(mockInput, true, "cartofriches", req);

      // Assert
      expect(origineDetectionService.detecterOrigine).toHaveBeenCalledWith(
        req,
        true,
        "cartofriches",
      );
    });

    it("devrait passer l'origine detectee au service enrichissement", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);
      origineDetectionService.detecterOrigine.mockReturnValue({
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur: "cartofriches.fr",
      });

      // Act
      await controller.enrichirParcelle(mockInput);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith(
        "29232000AB0123",
        SourceUtilisation.IFRAME_INTEGREE,
        "cartofriches.fr",
      );
    });

    it("devrait utiliser API_DIRECTE par defaut", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);
      // Le mock retourne API_DIRECTE par defaut

      // Act
      await controller.enrichirParcelle(mockInput);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith(
        "29232000AB0123",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
    });

    it("devrait passer SITE_STANDALONE si detecte", async () => {
      // Arrange
      enrichissementService.enrichir.mockResolvedValue(mockOutput);
      origineDetectionService.detecterOrigine.mockReturnValue({
        source: SourceUtilisation.SITE_STANDALONE,
      });

      // Act
      await controller.enrichirParcelle(mockInput);

      // Assert
      expect(enrichissementService.enrichir).toHaveBeenCalledWith(
        "29232000AB0123",
        SourceUtilisation.SITE_STANDALONE,
        undefined,
      );
    });
  });
});
