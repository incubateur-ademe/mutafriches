import { describe, it, expect, beforeEach } from "vitest";
import { FiabiliteCalculator } from "./fiabilite.calculator";
import { POIDS_CRITERES } from "./algorithme.config";

describe("FiabiliteCalculator", () => {
  let calculator: FiabiliteCalculator;
  let poidsTotal: number;

  beforeEach(() => {
    calculator = new FiabiliteCalculator();
    poidsTotal = Object.values(POIDS_CRITERES).reduce((sum, poids) => sum + poids, 0);
  });

  describe("calculer", () => {
    it("devrait retourner une note de 0 si aucun critere n'est renseigne", () => {
      const criteres = {
        surfaceSite: null,
        surfaceBati: undefined,
        siteEnCentreVille: "ne-sait-pas",
      };

      const result = calculator.calculer(criteres);

      expect(result.note).toBe(0);
      expect(result.criteresRenseignes).toBe(0);
    });

    it("devrait calculer la note proportionnellement aux poids", () => {
      // surfaceSite a un poids de 2
      const criteres = {
        surfaceSite: 10000,
      };

      const result = calculator.calculer(criteres);

      // poids renseignes = 2, poids total = 26
      // pourcentage = (2/26) * 100 = 7.69%
      // note = 7.69 / 10 = 0.77 -> arrondi a 0.5 pres = 1
      const expectedPourcentage = (2 / poidsTotal) * 100;
      const expectedNote = Math.round((expectedPourcentage / 10) * 2) / 2;

      expect(result.note).toBe(expectedNote);
      expect(result.criteresRenseignes).toBe(1);
    });

    it("devrait retourner 10 si tous les criteres sont renseignes", () => {
      const criteres: Record<string, unknown> = {};
      Object.keys(POIDS_CRITERES).forEach((key) => {
        criteres[key] = "une-valeur";
      });

      const result = calculator.calculer(criteres);

      expect(result.note).toBe(10);
      expect(result.criteresRenseignes).toBe(Object.keys(POIDS_CRITERES).length);
    });

    it("devrait ignorer les valeurs null, undefined et ne-sait-pas", () => {
      const criteres = {
        surfaceSite: 10000, // poids 2 - compte
        surfaceBati: null, // ignore
        siteEnCentreVille: undefined, // ignore
        typeProprietaire: "ne-sait-pas", // ignore
        distanceAutoroute: 5, // poids 0.5 - compte
      };

      const result = calculator.calculer(criteres);

      // Seuls surfaceSite (2) et distanceAutoroute (0.5) comptent
      const expectedPourcentage = (2.5 / poidsTotal) * 100;
      const expectedNote = Math.round((expectedPourcentage / 10) * 2) / 2;

      expect(result.note).toBe(expectedNote);
      expect(result.criteresRenseignes).toBe(2);
    });

    it("devrait favoriser les criteres a poids eleve", () => {
      // 2 criteres de poids 2 chacun = 4
      const criteresPoidsEleves = {
        surfaceSite: 10000, // poids 2
        surfaceBati: 5000, // poids 2
      };

      // 4 criteres de poids 1 ou 0.5 = 3
      const criteresPoidsFaibles = {
        siteEnCentreVille: true, // poids 1
        distanceAutoroute: 5, // poids 0.5
        qualiteVoieDesserte: "accessible", // poids 0.5
        distanceTransportCommun: 300, // poids 1
      };

      const resultEleves = calculator.calculer(criteresPoidsEleves);
      const resultFaibles = calculator.calculer(criteresPoidsFaibles);

      // 2 criteres de poids total 4 > 4 criteres de poids total 3
      expect(resultEleves.note).toBeGreaterThan(resultFaibles.note);
    });

    it("devrait arrondir la note a 0.5 pres", () => {
      // On va tester plusieurs cas d'arrondi
      // Note brute 7.3 -> 7.5
      // Note brute 7.7 -> 8
      // Note brute 7.25 -> 7.5
      // Note brute 7.24 -> 7

      const calculator = new FiabiliteCalculator();

      // Test via des criteres specifiques
      // Pour avoir une note precise, on calcule a rebours
      const criteres = {
        surfaceSite: 10000, // 2
        surfaceBati: 5000, // 2
        etatBatiInfrastructure: "test", // 2
        presencePollution: "non", // 2
        presenceRisquesNaturels: "faible", // 2
        zonageReglementaire: "U", // 2
      };
      // Total = 12, pourcentage = 12/26 * 100 = 46.15%, note = 4.615 -> 4.5

      const result = calculator.calculer(criteres);

      // Verifier que c'est un multiple de 0.5
      expect(result.note % 0.5).toBe(0);
    });

    it("devrait retourner le bon niveau de fiabilite selon la note", () => {
      // Note >= 8 -> Excellente
      const criteresExcellent: Record<string, unknown> = {};
      Object.keys(POIDS_CRITERES).forEach((key) => {
        criteresExcellent[key] = "valeur";
      });

      const resultExcellent = calculator.calculer(criteresExcellent);
      expect(resultExcellent.text).toBeDefined();
      expect(resultExcellent.description).toBeDefined();

      // Note faible
      const criteresFaible = {
        surfaceSite: 10000,
      };

      const resultFaible = calculator.calculer(criteresFaible);
      expect(resultFaible.text).toBeDefined();
      expect(resultFaible.description).toBeDefined();
    });

    it("devrait retourner criteresTotal egal au nombre de criteres dans POIDS_CRITERES", () => {
      const result = calculator.calculer({});

      expect(result.criteresTotal).toBe(Object.keys(POIDS_CRITERES).length);
    });
  });

  describe("getPoidsTotal", () => {
    it("devrait retourner la somme de tous les poids", () => {
      const expectedTotal = Object.values(POIDS_CRITERES).reduce((sum, p) => sum + p, 0);

      expect(calculator.getPoidsTotal()).toBe(expectedTotal);
    });
  });
});
