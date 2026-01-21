import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { OrchestrateurService } from "./orchestrateur.service";
import { CalculService } from "./calcul.service";
import { EnrichissementService } from "../../enrichissement/services/enrichissement.service";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { Parcelle } from "../entities/parcelle.entity";
import { createMockEnrichissementService } from "../../enrichissement/__test-helpers__/enrichissement.mocks";
import {
  createMockCalculService,
  createMockEvaluationRepository,
} from "../__test-helpers__/evaluation.mocks";
import {
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  TrameVerteEtBleue,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";

describe("OrchestrateurService", () => {
  let service: OrchestrateurService;
  let enrichissementService: ReturnType<typeof createMockEnrichissementService>;
  let calculService: ReturnType<typeof createMockCalculService>;
  let evaluationRepository: ReturnType<typeof createMockEvaluationRepository>;

  beforeEach(async () => {
    const mockEnrichissement = createMockEnrichissementService();
    const mockCalcul = createMockCalculService();
    const mockRepository = createMockEvaluationRepository();

    // Configuration par defaut du mock cache (pas de cache)
    mockRepository.findValidCache.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestrateurService,
        { provide: EnrichissementService, useValue: mockEnrichissement },
        { provide: CalculService, useValue: mockCalcul },
        { provide: EvaluationRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<OrchestrateurService>(OrchestrateurService);
    enrichissementService = mockEnrichissement;
    calculService = mockCalcul;
    evaluationRepository = mockRepository;
  });

  describe("enrichirParcelle", () => {
    it("devrait enrichir une parcelle via le service d'enrichissement", async () => {
      const input = { identifiant: "490055000AI0001" };
      const mockEnrichissement = {
        identifiantParcelle: "490055000AI0001",
        surfaceSite: 42780,
        surfaceBati: 6600,
        sourcesUtilisees: ["Cadastre", "BDNB"],
        fiabilite: 8.5,
      } as any;

      enrichissementService.enrichir.mockResolvedValue(mockEnrichissement);

      const result = await service.enrichirParcelle(input);

      expect(enrichissementService.enrichir).toHaveBeenCalledWith(input.identifiant);
      expect(result).toBe(mockEnrichissement);
    });
  });

  describe("calculerMutabilite", () => {
    it("devrait calculer la mutabilité avec des données enrichies", async () => {
      const mockEnrichissement = {
        identifiantParcelle: "490055000AI0001",
        surfaceSite: 10000,
        surfaceBati: 2000,
      } as any;

      const mockDonneesComplementaires = {
        siteEnCentreVille: true,
        raccordementEau: true,
      } as any;

      const input = {
        donneesEnrichies: mockEnrichissement,
        donneesComplementaires: mockDonneesComplementaires,
      };

      const mockResultatCalcul = {
        fiabilite: { note: 7.5, text: "Bonne" },
        resultats: [{ usage: "RESIDENTIEL", rang: 1, indiceMutabilite: 75 }],
      } as any;

      // Mock de Parcelle.fromEnrichissement
      const mockParcelle = new Parcelle();
      mockParcelle.identifiantParcelle = "490055000AI0001";
      vi.spyOn(Parcelle, "fromEnrichissement").mockReturnValue(mockParcelle);
      vi.spyOn(mockParcelle, "estComplete").mockReturnValue(true);

      calculService.calculer.mockResolvedValue(mockResultatCalcul);
      evaluationRepository.save.mockResolvedValue("eval-123");

      const result = await service.calculerMutabilite(input);

      expect(Parcelle.fromEnrichissement).toHaveBeenCalledWith(
        mockEnrichissement,
        mockDonneesComplementaires,
      );
      expect(calculService.calculer).toHaveBeenCalledWith(mockParcelle, undefined);
      expect(evaluationRepository.save).toHaveBeenCalled();
      expect(result.evaluationId).toBe("eval-123");
      expect(result.fiabilite).toEqual(mockResultatCalcul.fiabilite);
      expect(result.resultats).toEqual(mockResultatCalcul.resultats);
    });

    it("devrait lancer une erreur si les données enrichies manquent", async () => {
      const input = {
        donneesComplementaires: { siteEnCentreVille: true },
      } as any;

      await expect(service.calculerMutabilite(input)).rejects.toThrow(
        "Données enrichies manquantes dans la requête",
      );
    });

    it("devrait lancer une erreur si la parcelle n'est pas complète", async () => {
      const input = {
        donneesEnrichies: { identifiantParcelle: "123" },
        donneesComplementaires: {},
      } as any;

      const mockParcelle = new Parcelle();
      vi.spyOn(Parcelle, "fromEnrichissement").mockReturnValue(mockParcelle);
      vi.spyOn(mockParcelle, "estComplete").mockReturnValue(false);

      await expect(service.calculerMutabilite(input)).rejects.toThrow(
        "Parcelle incomplète pour le calcul",
      );
    });

    it("devrait supporter le mode détaillé", async () => {
      const input = {
        donneesEnrichies: { identifiantParcelle: "123", surfaceSite: 10000 } as any,
        donneesComplementaires: {} as any,
      };

      const options = { modeDetaille: true };

      const mockParcelle = new Parcelle();
      vi.spyOn(Parcelle, "fromEnrichissement").mockReturnValue(mockParcelle);
      vi.spyOn(mockParcelle, "estComplete").mockReturnValue(true);

      const mockResultat = {
        fiabilite: { note: 5 },
        resultats: [],
      } as any;

      calculService.calculer.mockResolvedValue(mockResultat);
      evaluationRepository.save.mockResolvedValue("eval-456");

      await service.calculerMutabilite(input, options);

      expect(calculService.calculer).toHaveBeenCalledWith(mockParcelle, options);
    });
  });

  describe("evaluerParcelle", () => {
    it("devrait orchestrer enrichissement + calcul + sauvegarde", async () => {
      const identifiant = "490055000AI0001";
      const donneesComplementaires = {
        siteEnCentreVille: true,
      } as any;

      const mockEnrichissement = {
        identifiantParcelle: identifiant,
        surfaceSite: 15000,
        surfaceBati: 3000,
      } as any;

      const mockMutabilite = {
        fiabilite: { note: 8 },
        resultats: [],
        evaluationId: "eval-789",
      } as any;

      enrichissementService.enrichir.mockResolvedValue(mockEnrichissement);

      // Mock de la méthode calculerMutabilite
      vi.spyOn(service, "calculerMutabilite").mockResolvedValue(mockMutabilite);

      evaluationRepository.save.mockResolvedValue("eval-final");

      const result = await service.evaluerParcelle(identifiant, donneesComplementaires);

      expect(enrichissementService.enrichir).toHaveBeenCalledWith(identifiant);
      expect(service.calculerMutabilite).toHaveBeenCalledWith({
        donneesEnrichies: mockEnrichissement,
        donneesComplementaires,
      });
      expect(result).toEqual({
        enrichissement: mockEnrichissement,
        mutabilite: mockMutabilite,
        evaluationId: "eval-final",
      });
    });
  });

  describe("recupererEvaluation", () => {
    it("devrait récupérer une évaluation par son ID", async () => {
      const evaluationId = "eval-123";
      const mockEvaluation = {
        id: evaluationId,
        identifiantParcelle: "490055000AI0001",
      } as any;

      evaluationRepository.findById.mockResolvedValue(mockEvaluation);

      const result = await service.recupererEvaluation(evaluationId);

      expect(evaluationRepository.findById).toHaveBeenCalledWith(evaluationId);
      expect(result).toBe(mockEvaluation);
    });

    it("devrait retourner null si l'évaluation n'existe pas", async () => {
      evaluationRepository.findById.mockResolvedValue(null);

      const result = await service.recupererEvaluation("inexistant");

      expect(result).toBeNull();
    });
  });

  describe("cache des evaluations", () => {
    const mockEnrichissement = {
      identifiantParcelle: "490055000AI0001",
      codeInsee: "49055",
      surfaceSite: 10000,
      surfaceBati: 2000,
    } as any;

    const mockDonneesComplementaires: DonneesComplementairesInputDto = {
      siteEnCentreVille: true,
      typeProprietaire: TypeProprietaire.PUBLIC,
      raccordementEau: RaccordementEau.OUI,
      etatBatiInfrastructure: EtatBatiInfrastructure.EN_FRICHE,
      presencePollution: PresencePollution.NON,
      valeurArchitecturaleHistorique: ValeurArchitecturale.AUCUNE,
      qualitePaysage: QualitePaysage.BONNE,
      qualiteVoieDesserte: QualiteVoieDesserte.BONNE,
      trameVerteEtBleue: TrameVerteEtBleue.NON,
    };

    it("devrait utiliser le cache si une evaluation valide existe", async () => {
      const cachedResultats = {
        fiabilite: { note: 8, text: "Tres bonne" },
        resultats: [{ usage: "RESIDENTIEL", rang: 1, indiceMutabilite: 80 }],
      };

      const cachedEvaluation = {
        id: "cached-eval-123",
        resultats: cachedResultats,
        donneesEnrichissement: mockEnrichissement,
        donneesComplementaires: mockDonneesComplementaires,
      };

      evaluationRepository.findValidCache.mockResolvedValue(cachedEvaluation);
      evaluationRepository.save.mockResolvedValue("new-eval-456");

      const input = {
        donneesEnrichies: mockEnrichissement,
        donneesComplementaires: mockDonneesComplementaires,
      };

      const result = await service.calculerMutabilite(input);

      // Verifie que le cache a ete consulte
      expect(evaluationRepository.findValidCache).toHaveBeenCalledWith(
        mockEnrichissement.identifiantParcelle,
        mockDonneesComplementaires,
      );

      // Verifie que le calcul n'a PAS ete effectue
      expect(calculService.calculer).not.toHaveBeenCalled();

      // Verifie que save a ete appele avec l'id source pour tracabilite
      expect(evaluationRepository.save).toHaveBeenCalled();
      const saveCall = evaluationRepository.save.mock.calls[0] as [any, string];
      expect(saveCall[1]).toBe("cached-eval-123");

      // Verifie le resultat
      expect(result.fiabilite).toEqual(cachedResultats.fiabilite);
      expect(result.resultats).toEqual(cachedResultats.resultats);
      expect(result.evaluationId).toBe("new-eval-456");
    });

    it("devrait effectuer le calcul complet si pas de cache", async () => {
      evaluationRepository.findValidCache.mockResolvedValue(null);

      const mockResultatCalcul = {
        fiabilite: { note: 7.5, text: "Bonne" },
        resultats: [{ usage: "RESIDENTIEL", rang: 1, indiceMutabilite: 75 }],
      } as any;

      const mockParcelle = new Parcelle();
      mockParcelle.identifiantParcelle = "490055000AI0001";
      vi.spyOn(Parcelle, "fromEnrichissement").mockReturnValue(mockParcelle);
      vi.spyOn(mockParcelle, "estComplete").mockReturnValue(true);

      calculService.calculer.mockResolvedValue(mockResultatCalcul);
      evaluationRepository.save.mockResolvedValue("eval-new");

      const input = {
        donneesEnrichies: mockEnrichissement,
        donneesComplementaires: mockDonneesComplementaires,
      };

      const result = await service.calculerMutabilite(input);

      // Verifie que le cache a ete consulte
      expect(evaluationRepository.findValidCache).toHaveBeenCalled();

      // Verifie que le calcul a ete effectue
      expect(calculService.calculer).toHaveBeenCalledWith(mockParcelle, undefined);

      // Verifie que save a ete appele SANS id source
      expect(evaluationRepository.save).toHaveBeenCalled();
      const saveCall = evaluationRepository.save.mock.calls[0] as [any, string | undefined];
      expect(saveCall[1]).toBeUndefined();

      expect(result.evaluationId).toBe("eval-new");
    });

    it("devrait effectuer le calcul si donnees complementaires contiennent 'je ne sais pas'", async () => {
      // findValidCache retourne null car il detecte "je ne sais pas"
      evaluationRepository.findValidCache.mockResolvedValue(null);

      const donneesAvecJeNeSaisPas: DonneesComplementairesInputDto = {
        ...mockDonneesComplementaires,
        presencePollution: PresencePollution.NE_SAIT_PAS,
      };

      const mockResultatCalcul = {
        fiabilite: { note: 6, text: "Moyenne" },
        resultats: [],
      } as any;

      const mockParcelle = new Parcelle();
      vi.spyOn(Parcelle, "fromEnrichissement").mockReturnValue(mockParcelle);
      vi.spyOn(mockParcelle, "estComplete").mockReturnValue(true);

      calculService.calculer.mockResolvedValue(mockResultatCalcul);
      evaluationRepository.save.mockResolvedValue("eval-new");

      const input = {
        donneesEnrichies: mockEnrichissement,
        donneesComplementaires: donneesAvecJeNeSaisPas,
      };

      await service.calculerMutabilite(input);

      // Le calcul doit etre effectue car "je ne sais pas" invalide le cache
      expect(calculService.calculer).toHaveBeenCalled();
    });
  });
});
