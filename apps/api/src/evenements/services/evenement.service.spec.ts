import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeEvenement } from "@mutafriches/shared-types";
import { EvenementService } from "./evenement.service";
import { EvenementRepository } from "../repositories/evenement.repository";

describe("EvenementService - Sécurité", () => {
  let service: EvenementService;

  const mockRepository = {
    enregistrerEvenement: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

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

  describe("Sanitisation du champ donnees (JSONB)", () => {
    it("devrait nettoyer XSS dans donnees.contexte", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "<script>alert(1)</script>",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.contexte).not.toContain("<script>");
    });

    it("devrait bloquer les clés non autorisées", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "valide",
          cleNonAutorisee: "malveillant",
          autreCleMalveillante: "<script>",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees).toHaveProperty("contexte");
      expect(savedEvent.donnees).not.toHaveProperty("cleNonAutorisee");
      expect(savedEvent.donnees).not.toHaveProperty("autreCleMalveillante");
    });

    it("devrait nettoyer template injection ${}", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          commentaire: "Test ${malicious}",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.commentaire).not.toContain("${");
    });

    it("devrait nettoyer template injection {{}}", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          commentaire: "Test {{malicious}}",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.commentaire).not.toContain("{{");
    });

    it("devrait nettoyer template injection <%>", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          commentaire: "Test <%malicious%>",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.commentaire).not.toContain("<%");
      expect(savedEvent.donnees?.commentaire).not.toContain("%>");
    });

    it("devrait nettoyer ESI injection", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: '<esi:include src="http://evil.com"/>',
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.contexte).not.toContain("esi:include");
    });

    it("devrait nettoyer les URLs http/https", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          commentaire: "Visitez http://malicious.com",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.commentaire).not.toContain("http://");
    });

    it("devrait préserver les booleans", async () => {
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

    it("devrait limiter les nombres", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          metadata: 99999999,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.metadata).toBe(999999);
    });

    it("devrait gérer les valeurs null", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          commentaire: null,
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.commentaire).toBeNull();
    });

    it("devrait ignorer les objets imbriqués", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "valide",
          objetImbrique: { malicious: "<script>" },
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees).toHaveProperty("contexte");
      expect(savedEvent.donnees).not.toHaveProperty("objetImbrique");
    });

    it("devrait retourner undefined si aucune clé valide", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          cleInvalide1: "test",
          cleInvalide2: "test",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees).toBeUndefined();
    });
  });

  describe("Cas d'attaque XSS", () => {
    it("devrait bloquer une attaque XSS", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "'\"()&%<zzz><ScRiPt >ErKB(9677)</ScRiPt>",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.contexte).not.toContain("<ScRiPt");
      expect(savedEvent.donnees?.contexte).not.toContain("</ScRiPt>");
    });

    it("devrait bloquer les payloads SSTI réels", async () => {
      const input = {
        typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES,
        donnees: {
          contexte: "dfb__${98991*97996}__::.x",
        },
      };

      await service.enregistrerEvenement(input);

      const savedEvent = vi.mocked(mockRepository.enregistrerEvenement).mock.calls[0][0];
      expect(savedEvent.donnees?.contexte).not.toContain("${");
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
});
