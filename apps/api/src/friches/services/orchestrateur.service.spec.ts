import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { OrchestrateurService } from "./orchestrateur.service";
import { EnrichissementService } from "./enrichissement.service";
import { CalculService } from "./calcul.service";
import { EvaluationRepository } from "../repository/evaluation.repository";
import { Parcelle } from "../domain/entities/parcelle.entity";

describe("OrchestrateurService", () => {
  let service: OrchestrateurService;
  let enrichissementService: EnrichissementService;
  let calculService: CalculService;
  let evaluationRepository: EvaluationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestrateurService,
        {
          provide: EnrichissementService,
          useValue: {
            enrichir: vi.fn(),
          },
        },
        {
          provide: CalculService,
          useValue: {
            calculer: vi.fn(),
          },
        },
        {
          provide: EvaluationRepository,
          useValue: {
            save: vi.fn(),
            findById: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrchestrateurService>(OrchestrateurService);
    enrichissementService = module.get<EnrichissementService>(EnrichissementService);
    calculService = module.get<CalculService>(CalculService);
    evaluationRepository = module.get<EvaluationRepository>(EvaluationRepository);
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

      vi.mocked(enrichissementService.enrichir).mockResolvedValue(mockEnrichissement);

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
        terrainViabilise: true,
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

      vi.mocked(calculService.calculer).mockResolvedValue(mockResultatCalcul);
      vi.mocked(evaluationRepository.save).mockResolvedValue("eval-123");

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

      vi.mocked(calculService.calculer).mockResolvedValue(mockResultat);
      vi.mocked(evaluationRepository.save).mockResolvedValue("eval-456");

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

      vi.mocked(enrichissementService.enrichir).mockResolvedValue(mockEnrichissement);

      // Mock de la méthode calculerMutabilite
      vi.spyOn(service, "calculerMutabilite").mockResolvedValue(mockMutabilite);

      vi.mocked(evaluationRepository.save).mockResolvedValue("eval-final");

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

      vi.mocked(evaluationRepository.findById).mockResolvedValue(mockEvaluation);

      const result = await service.recupererEvaluation(evaluationId);

      expect(evaluationRepository.findById).toHaveBeenCalledWith(evaluationId);
      expect(result).toBe(mockEvaluation);
    });

    it("devrait retourner null si l'évaluation n'existe pas", async () => {
      vi.mocked(evaluationRepository.findById).mockResolvedValue(null);

      const result = await service.recupererEvaluation("inexistant");

      expect(result).toBeNull();
    });
  });
});
