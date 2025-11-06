import { describe, it, expect, beforeEach, vi } from "vitest";
import { TypeEvenement } from "@mutafriches/shared-types";
import { createTestingModuleWithService } from "../shared/__test-helpers__/test-module.factory";
import { createMockEvenementService } from "./__test-helpers__/evenement.mocks";
import { EvenementsController } from "./evenements.controller";
import { EvenementService } from "./services/evenement.service";

describe("EvenementsController", () => {
  let controller: EvenementsController;
  let service: ReturnType<typeof createMockEvenementService>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const setup = await createTestingModuleWithService(
      EvenementsController,
      EvenementService,
      createMockEvenementService(),
    );

    controller = setup.controller;
    service = setup.service;
  });

  describe("POST /evenements", () => {
    const mockOutput = {
      id: "evt-123456789-abc123",
      typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      dateCreation: new Date().toISOString(),
      success: true,
    };

    it("devrait enregistrer un evenement basique", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        evaluationId: "eval-123",
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      const result = await controller.enregistrerEvenement(input);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: undefined,
      });
      expect(result).toEqual(mockOutput);
    });

    it("devrait detecter le mode iframe quand iframe=true", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, true);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "iframe",
        integrateur: undefined,
        userAgent: undefined,
      });
    });

    it("devrait utiliser standalone quand iframe=false", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, false);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: undefined,
      });
    });

    it("devrait passer l'integrateur au service", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, undefined, "cartofriches");

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: "cartofriches",
        userAgent: undefined,
      });
    });

    it("devrait combiner iframe=true et integrateur", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, true, "cartofriches");

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "iframe",
        integrateur: "cartofriches",
        userAgent: undefined,
      });
    });

    it("devrait extraire le user-agent de la requete", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      const mockRequest = {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      } as any;
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, undefined, undefined, mockRequest);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      });
    });

    it("devrait gerer une requete sans user-agent", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      const mockRequest = {
        headers: {},
      } as any;
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, undefined, undefined, mockRequest);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: undefined,
      });
    });

    it("devrait passer tous les champs du body au service", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.FEEDBACK_PERTINENCE_CLASSEMENT,
        evaluationId: "eval-456",
        identifiantCadastral: "12345000AB0001",
        sessionId: "session-789",
        donnees: {
          pertinent: true,
          commentaire: "Très utile",
        },
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: undefined,
      });
    });

    it("devrait retourner la reponse du service", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      const customOutput = {
        id: "evt-custom-123",
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        dateCreation: "2025-11-05T10:00:00.000Z",
        success: true,
      };
      service.enregistrerEvenement.mockResolvedValue(customOutput);

      // Act
      const result = await controller.enregistrerEvenement(input);

      // Assert
      expect(result).toEqual(customOutput);
    });

    it("devrait propager les erreurs du service", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      const error = new Error("Database error");
      service.enregistrerEvenement.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.enregistrerEvenement(input)).rejects.toThrow("Database error");
    });

    it("devrait gerer iframe avec string 'true'", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, "true" as any);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "iframe",
        integrateur: undefined,
        userAgent: undefined,
      });
    });

    it("devrait gerer iframe avec string 'false'", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, "false" as any);

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: undefined,
      });
    });

    it("devrait ignorer integrateur vide", async () => {
      // Arrange
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      // Act
      await controller.enregistrerEvenement(input, undefined, "");

      // Assert
      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, {
        sourceUtilisation: "standalone",
        integrateur: undefined,
        userAgent: undefined,
      });
    });
  });

  describe("TypeEvenement - Couverture des types", () => {
    const mockOutput = {
      id: "evt-123",
      typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      dateCreation: new Date().toISOString(),
      success: true,
    };

    it("devrait gerer FEEDBACK_PERTINENCE_CLASSEMENT", async () => {
      const input = {
        typeEvenement: TypeEvenement.FEEDBACK_PERTINENCE_CLASSEMENT,
        donnees: { pertinent: true },
      };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      await controller.enregistrerEvenement(input);

      expect(service.enregistrerEvenement).toHaveBeenCalled();
    });

    it("devrait gerer INTERET_MULTI_PARCELLES", async () => {
      const input = { typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      await controller.enregistrerEvenement(input);

      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, expect.any(Object));
    });

    it("devrait gerer INTERET_MISE_EN_RELATION", async () => {
      const input = { typeEvenement: TypeEvenement.INTERET_MISE_EN_RELATION };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      await controller.enregistrerEvenement(input);

      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, expect.any(Object));
    });

    it("devrait gerer INTERET_EXPORT_RESULTATS", async () => {
      const input = { typeEvenement: TypeEvenement.INTERET_EXPORT_RESULTATS };
      service.enregistrerEvenement.mockResolvedValue(mockOutput);

      await controller.enregistrerEvenement(input);

      expect(service.enregistrerEvenement).toHaveBeenCalledWith(input, expect.any(Object));
    });
  });
});
