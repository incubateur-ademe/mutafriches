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
      expect(result.poidsRenseignes).toBe(0);
      expect(result.poidsTotal).toBe(poidsTotal);
    });

    it("devrait calculer la note proportionnellement aux poids", () => {
      const criteres = {
        surfaceSite: 10000, // poids 2
      };

      const result = calculator.calculer(criteres);

      const expectedPourcentage = (2 / poidsTotal) * 100;
      const expectedNote = Math.round((expectedPourcentage / 10) * 2) / 2;

      expect(result.note).toBe(expectedNote);
      expect(result.criteresRenseignes).toBe(1);
      expect(result.poidsRenseignes).toBe(2);
    });

    it("devrait retourner 10 si tous les criteres sont renseignes", () => {
      const criteres: Record<string, unknown> = {};
      Object.keys(POIDS_CRITERES).forEach((key) => {
        criteres[key] = "une-valeur";
      });

      const result = calculator.calculer(criteres);

      expect(result.note).toBe(10);
      expect(result.criteresRenseignes).toBe(Object.keys(POIDS_CRITERES).length);
      expect(result.poidsRenseignes).toBe(poidsTotal);
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

      const expectedPourcentage = (2.5 / poidsTotal) * 100;
      const expectedNote = Math.round((expectedPourcentage / 10) * 2) / 2;

      expect(result.note).toBe(expectedNote);
      expect(result.criteresRenseignes).toBe(2);
      expect(result.poidsRenseignes).toBe(2.5);
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

      expect(resultEleves.note).toBeGreaterThan(resultFaibles.note);
      expect(resultEleves.poidsRenseignes).toBe(4);
      expect(resultFaibles.poidsRenseignes).toBe(3);
    });

    it("devrait arrondir la note a 0.5 pres", () => {
      const criteres = {
        surfaceSite: 10000, // 2
        surfaceBati: 5000, // 2
        etatBatiInfrastructure: "test", // 2
        presencePollution: "non", // 2
        presenceRisquesNaturels: "faible", // 2
        zonageReglementaire: "U", // 2
      };

      const result = calculator.calculer(criteres);

      expect(result.note % 0.5).toBe(0);
    });

    it("devrait retourner le bon niveau de fiabilite selon la note", () => {
      const criteresExcellent: Record<string, unknown> = {};
      Object.keys(POIDS_CRITERES).forEach((key) => {
        criteresExcellent[key] = "valeur";
      });

      const resultExcellent = calculator.calculer(criteresExcellent);
      expect(resultExcellent.text).toBeDefined();
      expect(resultExcellent.description).toBeDefined();

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

  describe("calculer avec detail", () => {
    it("devrait inclure le detail des criteres si demande", () => {
      const criteres = {
        surfaceSite: 10000,
        surfaceBati: null,
      };

      const result = calculator.calculer(criteres, { inclureDetail: true });

      expect(result.detailCriteres).toBeDefined();
      expect(result.detailCriteres).toBeInstanceOf(Array);
      expect(result.detailCriteres!.length).toBe(Object.keys(POIDS_CRITERES).length);

      const surfaceSiteDetail = result.detailCriteres!.find((d) => d.critere === "surfaceSite");
      expect(surfaceSiteDetail).toBeDefined();
      expect(surfaceSiteDetail!.poids).toBe(2);
      expect(surfaceSiteDetail!.renseigne).toBe(true);

      const surfaceBatiDetail = result.detailCriteres!.find((d) => d.critere === "surfaceBati");
      expect(surfaceBatiDetail).toBeDefined();
      expect(surfaceBatiDetail!.poids).toBe(2);
      expect(surfaceBatiDetail!.renseigne).toBe(false);
    });

    it("ne devrait pas inclure le detail si explicitement desactive", () => {
      const criteres = { surfaceSite: 10000 };

      const result = calculator.calculer(criteres, { inclureDetail: false });

      expect(result.detailCriteres).toBeUndefined();
    });

    it("devrait inclure le detail par defaut", () => {
      const criteres = { surfaceSite: 10000 };

      const result = calculator.calculer(criteres);

      expect(result.detailCriteres).toBeDefined();
      expect(result.detailCriteres).toBeInstanceOf(Array);
    });

    it("devrait lister tous les criteres de POIDS_CRITERES dans le detail", () => {
      const criteres = {
        surfaceSite: 10000,
      };

      const result = calculator.calculer(criteres, { inclureDetail: true });

      const criteresInDetail = result.detailCriteres!.map((d) => d.critere);
      const criteresInConfig = Object.keys(POIDS_CRITERES);

      expect(criteresInDetail.sort()).toEqual(criteresInConfig.sort());
    });

    it("devrait avoir les bons poids dans le detail", () => {
      const result = calculator.calculer({}, { inclureDetail: true });

      result.detailCriteres!.forEach((detail) => {
        const expectedPoids = POIDS_CRITERES[detail.critere as keyof typeof POIDS_CRITERES];
        expect(detail.poids).toBe(expectedPoids);
      });
    });
  });

  describe("getPoidsTotal", () => {
    it("devrait retourner la somme de tous les poids", () => {
      const expectedTotal = Object.values(POIDS_CRITERES).reduce((sum, p) => sum + p, 0);

      expect(calculator.getPoidsTotal()).toBe(expectedTotal);
    });
  });
});
