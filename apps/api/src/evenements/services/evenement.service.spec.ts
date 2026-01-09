import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  TypeEvenement,
  ModeUtilisation,
  ContexteEvenement,
  UsageType,
} from "@mutafriches/shared-types";
import { EvenementService } from "./evenement.service";
import { EvenementRepository } from "../repositories/evenement.repository";

describe("EvenementService - Sécurité", () => {
  let service: EvenementService;

  const mockRepository = {
    enregistrerEvenement: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvenementService,
        {
          provide: EvenementRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EvenementService>(EvenementService);

    vi.clearAllMocks();
  });

  describe("Sanitisation des strings", () => {
    it("devrait nettoyer les caractères XSS basiques dans evaluationId", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        evaluationId: "eval-123<script>alert(1)</script>",
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.evaluationId).toBe("eval-123scriptalert(1)/script");
      expect(savedEvent.evaluationId).not.toContain("<");
      expect(savedEvent.evaluationId).not.toContain(">");
    });

    it("devrait nettoyer javascript: protocol", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        evaluationId: "eval-javascript:alert(1)",
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.evaluationId).not.toContain("javascript:");
    });

    it("devrait nettoyer les event handlers (onclick, onerror)", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        identifiantCadastral: "123onclick=alert(1)",
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.identifiantCadastral).not.toContain("onclick=");
    });

    it("devrait tronquer les strings trop longues", async () => {
      const longString = "a".repeat(300);
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        sessionId: longString,
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.sessionId?.length).toBeLessThanOrEqual(255);
    });

    it("devrait gérer les valeurs undefined sans erreur", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        evaluationId: undefined,
        identifiantCadastral: undefined,
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.evaluationId).toBeUndefined();
      expect(savedEvent.identifiantCadastral).toBeUndefined();
    });

    it("devrait nettoyer integrateur", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
      };

      await service.enregistrerEvenement(input, {
        integrateur: "urbanvitaliz<script>",
        modeUtilisation: ModeUtilisation.IFRAME,
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.integrateur).not.toContain("<script>");
    });

    it("devrait nettoyer ref", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
      };

      await service.enregistrerEvenement(input, {
        ref: "page-accueil<script>alert(1)</script>",
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.ref).not.toContain("<script>");
    });
  });

  describe("Tracking des integrateurs", () => {
    it("devrait enregistrer ref et modeUtilisation", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
      };

      await service.enregistrerEvenement(input, {
        ref: "page-accueil",
        modeUtilisation: ModeUtilisation.STANDALONE,
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.ref).toBe("page-accueil");
      expect(savedEvent.modeUtilisation).toBe(ModeUtilisation.STANDALONE);
    });

    it("devrait enregistrer le mode iframe avec integrateur", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
      };

      await service.enregistrerEvenement(input, {
        ref: "simulateur",
        modeUtilisation: ModeUtilisation.IFRAME,
        integrateur: "benefriches",
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.ref).toBe("simulateur");
      expect(savedEvent.modeUtilisation).toBe(ModeUtilisation.IFRAME);
      expect(savedEvent.integrateur).toBe("benefriches");
    });

    it("devrait accepter ref undefined", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
      };

      await service.enregistrerEvenement(input, {
        modeUtilisation: ModeUtilisation.STANDALONE,
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.ref).toBeUndefined();
      expect(savedEvent.modeUtilisation).toBe(ModeUtilisation.STANDALONE);
    });
  });

  describe("Sanitisation du User-Agent", () => {
    it("devrait nettoyer XSS dans user-agent", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };

      await service.enregistrerEvenement(input, {
        userAgent: "Mozilla/5.0 <script>alert(1)</script>",
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.userAgent).not.toContain("<script>");
    });

    it("devrait tronquer user-agent à 500 caractères", async () => {
      const longUserAgent = "Mozilla/5.0 " + "a".repeat(600);
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };

      await service.enregistrerEvenement(input, {
        userAgent: longUserAgent,
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.userAgent?.length).toBeLessThanOrEqual(500);
    });
  });

  describe("Validation stricte du champ donnees", () => {
    it("devrait rejeter un contexte invalide (non dans l'enum)", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "<script>alert(1)</script>" as ContexteEvenement,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      // Contexte invalide est ignore silencieusement
      expect(savedEvent.donnees?.contexte).toBeUndefined();
    });

    it("devrait accepter un contexte valide de l'enum", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: ContexteEvenement.SELECTION_PARCELLE,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.contexte).toBe(ContexteEvenement.SELECTION_PARCELLE);
    });

    it("devrait accepter le contexte retrocompatible step1_toggle", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: ContexteEvenement.STEP1_TOGGLE,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.contexte).toBe(ContexteEvenement.STEP1_TOGGLE);
    });

    it("devrait autoriser nombreChampsSaisis dans donnees", async () => {
      const input = {
        typeEvenement: TypeEvenement.DONNEES_COMPLEMENTAIRES_SAISIES,
        donnees: {
          nombreChampsSaisis: 5,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.nombreChampsSaisis).toBe(5);
    });

    it("devrait limiter nombreChampsSaisis entre 0 et 100", async () => {
      const input = {
        typeEvenement: TypeEvenement.DONNEES_COMPLEMENTAIRES_SAISIES,
        donnees: {
          nombreChampsSaisis: 999,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.nombreChampsSaisis).toBe(100);
    });

    it("devrait nettoyer XSS dans commentaire", async () => {
      const input = {
        typeEvenement: TypeEvenement.FEEDBACK_PERTINENCE_CLASSEMENT,
        donnees: {
          pertinent: true,
          commentaire: "Test <script>alert(1)</script>",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.commentaire).not.toContain("<script>");
    });

    it("devrait preserver les booleans", async () => {
      const input = {
        typeEvenement: TypeEvenement.FEEDBACK_PERTINENCE_CLASSEMENT,
        donnees: {
          pertinent: true,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.pertinent).toBe(true);
    });

    it("devrait accepter usageConcerne valide de l'enum", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MISE_EN_RELATION,
        donnees: {
          usageConcerne: UsageType.RESIDENTIEL,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.usageConcerne).toBe(UsageType.RESIDENTIEL);
    });

    it("devrait rejeter usageConcerne invalide", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MISE_EN_RELATION,
        donnees: {
          usageConcerne: "invalid_usage" as UsageType,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.usageConcerne).toBeUndefined();
    });

    it("devrait valider page avec regex (pathname valide)", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
        donnees: {
          page: "/resultats",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.page).toBe("/resultats");
    });

    it("devrait rejeter page invalide (payload injection)", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
        donnees: {
          page: "/0XOR(if(now()=sysdate(),sleep(15),0))XORZ",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      // Page invalide est ignoree silencieusement
      expect(savedEvent.donnees?.page).toBeUndefined();
    });

    it("devrait retourner undefined si aucune donnee valide", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "invalid" as ContexteEvenement,
          usageConcerne: "invalid" as UsageType,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees).toBeUndefined();
    });
  });

  describe("Génération d'ID", () => {
    it("devrait générer un ID unique à chaque appel", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };

      await service.enregistrerEvenement(input);
      await service.enregistrerEvenement(input);

      const id1 = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0].id;
      const id2 = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[1][0].id;

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^evt-\d+-[a-z0-9]+$/);
    });
  });

  describe("Retour du service", () => {
    it("devrait retourner un événement avec les bonnes propriétés", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
      };

      const result = await service.enregistrerEvenement(input);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("typeEvenement", TypeEvenement.INTERET_MULTI_PARCELLES);
      expect(result).toHaveProperty("dateCreation");
      expect(result).toHaveProperty("success", true);
    });
  });

  describe("Nouveaux evenements de tracking", () => {
    it("devrait enregistrer un evenement VISITE", async () => {
      const input = {
        typeEvenement: TypeEvenement.VISITE,
      };

      await service.enregistrerEvenement(input, {
        ref: "page-accueil",
        modeUtilisation: ModeUtilisation.STANDALONE,
      });

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.typeEvenement).toBe(TypeEvenement.VISITE);
    });

    it("devrait enregistrer un événement ENRICHISSEMENT_TERMINE", async () => {
      const input = {
        typeEvenement: TypeEvenement.ENRICHISSEMENT_TERMINE,
        identifiantCadastral: "49007000AB0123",
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.typeEvenement).toBe(TypeEvenement.ENRICHISSEMENT_TERMINE);
      expect(savedEvent.identifiantCadastral).toBe("49007000AB0123");
    });

    it("devrait enregistrer un événement DONNEES_COMPLEMENTAIRES_SAISIES", async () => {
      const input = {
        typeEvenement: TypeEvenement.DONNEES_COMPLEMENTAIRES_SAISIES,
        identifiantCadastral: "49007000AB0123",
        donnees: {
          nombreChampsSaisis: 8,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.typeEvenement).toBe(TypeEvenement.DONNEES_COMPLEMENTAIRES_SAISIES);
      expect(savedEvent.donnees?.nombreChampsSaisis).toBe(8);
    });

    it("devrait enregistrer un événement EVALUATION_TERMINEE", async () => {
      const input = {
        typeEvenement: TypeEvenement.EVALUATION_TERMINEE,
        evaluationId: "eval-123",
        identifiantCadastral: "49007000AB0123",
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.typeEvenement).toBe(TypeEvenement.EVALUATION_TERMINEE);
      expect(savedEvent.evaluationId).toBe("eval-123");
    });
  });
});
