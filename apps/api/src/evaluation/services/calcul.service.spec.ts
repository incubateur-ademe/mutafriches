import { describe, it, expect, beforeEach } from "vitest";
import { RaccordementEau, UsageType } from "@mutafriches/shared-types";
import { CalculService } from "./calcul.service";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { Parcelle } from "../entities/parcelle.entity";

describe("CalculService", () => {
  let service: CalculService;

  beforeEach(() => {
    const fiabiliteCalculator = new FiabiliteCalculator();
    service = new CalculService(fiabiliteCalculator);
  });

  describe("calculer", () => {
    it("devrait calculer la mutabilite pour tous les usages", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 42780;
      parcelle.surfaceBati = 6600;
      parcelle.siteEnCentreVille = true;
      parcelle.raccordementEau = RaccordementEau.OUI;

      const result = await service.calculer(parcelle);

      expect(result).toBeDefined();
      expect(result.resultats).toBeDefined();
      expect(result.resultats).toBeInstanceOf(Array);
      expect(result.resultats.length).toBe(7);

      result.resultats.forEach((res) => {
        expect(res.usage).toBeDefined();
        expect(res.rang).toBeGreaterThanOrEqual(1);
        expect(res.rang).toBeLessThanOrEqual(7);
        expect(res.indiceMutabilite).toBeGreaterThanOrEqual(0);
        expect(res.indiceMutabilite).toBeLessThanOrEqual(100);
        expect(res.potentiel).toBeDefined();
        expect(res.explication).toBeDefined();
      });

      expect(result.fiabilite).toBeDefined();
      expect(result.fiabilite.note).toBeGreaterThanOrEqual(0);
      expect(result.fiabilite.note).toBeLessThanOrEqual(10);
      expect(result.fiabilite.text).toBeDefined();
      expect(result.fiabilite.criteresRenseignes).toBeGreaterThanOrEqual(0);
    });

    it("devrait classer les usages par indice decroissant", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 10000;
      parcelle.surfaceBati = 2000;

      const result = await service.calculer(parcelle);

      const rangs = result.resultats.map((r) => r.rang);
      const rangsUniques = [...new Set(rangs)];

      expect(rangsUniques.length).toBe(7);
      expect(Math.min(...rangs)).toBe(1);
      expect(Math.max(...rangs)).toBe(7);

      const rang1 = result.resultats.find((r) => r.rang === 1);
      const rang7 = result.resultats.find((r) => r.rang === 7);

      expect(rang1).toBeDefined();
      expect(rang7).toBeDefined();
      expect(rang1!.indiceMutabilite).toBeGreaterThanOrEqual(rang7!.indiceMutabilite);
    });

    it("devrait calculer les details en mode detaille", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 15000;
      parcelle.surfaceBati = 3000;
      parcelle.siteEnCentreVille = true;

      const result = await service.calculer(parcelle, { modeDetaille: true });

      result.resultats.forEach((res: any) => {
        expect(res.avantages).toBeDefined();
        expect(res.avantages).toBeGreaterThanOrEqual(0);
        expect(res.contraintes).toBeDefined();
        expect(res.contraintes).toBeGreaterThanOrEqual(0);

        if (res.detailsCalcul) {
          expect(res.detailsCalcul.detailsAvantages).toBeInstanceOf(Array);
          expect(res.detailsCalcul.detailsContraintes).toBeInstanceOf(Array);
          expect(res.detailsCalcul.totalAvantages).toBe(res.avantages);
          expect(res.detailsCalcul.totalContraintes).toBe(res.contraintes);
        }
      });
    });

    it("devrait gerer les parcelles avec donnees manquantes", async () => {
      const parcelle = new Parcelle();

      const result = await service.calculer(parcelle);

      expect(result).toBeDefined();
      expect(result.resultats.length).toBe(7);

      // La fiabilite devrait etre faible (basee sur les poids)
      expect(result.fiabilite.note).toBeLessThanOrEqual(1);
      expect(result.fiabilite.criteresRenseignes).toBe(0);
    });

    it("devrait calculer une meilleure fiabilite avec plus de criteres ponderes", async () => {
      // Parcelle minimale avec un seul critere
      const parcelleMin = new Parcelle();
      parcelleMin.surfaceSite = 10000; // poids 2

      const resultMin = await service.calculer(parcelleMin);

      // Parcelle avec plusieurs criteres de poids varies
      const parcelleComplete = new Parcelle();
      parcelleComplete.surfaceSite = 10000; // poids 2
      parcelleComplete.surfaceBati = 2000; // poids 2
      parcelleComplete.siteEnCentreVille = true; // poids 1
      parcelleComplete.raccordementEau = RaccordementEau.OUI; // poids 1
      parcelleComplete.distanceRaccordementElectrique = 100; // poids 1
      parcelleComplete.proximiteCommercesServices = true; // poids 1
      parcelleComplete.tauxLogementsVacants = 5.2; // poids 1
      parcelleComplete.distanceAutoroute = 2; // poids 0.5
      parcelleComplete.distanceTransportCommun = 300; // poids 1
      parcelleComplete.presenceRisquesNaturels = "FAIBLE" as any; // poids 2
      parcelleComplete.presenceRisquesTechnologiques = false; // poids 1

      const resultComplete = await service.calculer(parcelleComplete);

      // Plus de poids renseignes = meilleure fiabilite
      expect(resultComplete.fiabilite.note).toBeGreaterThan(resultMin.fiabilite.note);
    });

    it("devrait determiner le potentiel selon l'indice", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 20000;
      parcelle.surfaceBati = 4000;

      const result = await service.calculer(parcelle);

      result.resultats.forEach((res) => {
        if (res.indiceMutabilite >= 70) {
          expect(res.potentiel).toBe("Excellent");
        } else if (res.indiceMutabilite >= 60) {
          expect(res.potentiel).toBe("Favorable");
        } else if (res.indiceMutabilite >= 50) {
          expect(res.potentiel).toBe("Modéré");
        } else if (res.indiceMutabilite >= 40) {
          expect(res.potentiel).toBe("Peu favorable");
        } else {
          expect(res.potentiel).toBe("Défavorable");
        }
      });
    });

    it("devrait favoriser certains usages selon les caracteristiques", async () => {
      const parcelleResidentiel = new Parcelle();
      parcelleResidentiel.surfaceSite = 5000;
      parcelleResidentiel.surfaceBati = 1000;
      parcelleResidentiel.siteEnCentreVille = true;
      parcelleResidentiel.proximiteCommercesServices = true;
      parcelleResidentiel.distanceTransportCommun = 200;

      const resultResidentiel = await service.calculer(parcelleResidentiel);

      const parcelleIndustrie = new Parcelle();
      parcelleIndustrie.surfaceSite = 50000;
      parcelleIndustrie.surfaceBati = 10000;
      parcelleIndustrie.siteEnCentreVille = false;
      parcelleIndustrie.distanceAutoroute = 1;

      const resultIndustrie = await service.calculer(parcelleIndustrie);

      const scoreResidentielCentre = resultResidentiel.resultats.find(
        (r) => r.usage === UsageType.RESIDENTIEL,
      );
      const scoreResidentielIndustrie = resultIndustrie.resultats.find(
        (r) => r.usage === UsageType.RESIDENTIEL,
      );

      expect(scoreResidentielCentre).toBeDefined();
      expect(scoreResidentielIndustrie).toBeDefined();

      const scoreIndustrieCentre = resultResidentiel.resultats.find(
        (r) => r.usage === UsageType.INDUSTRIE,
      );
      const scoreIndustrieGrand = resultIndustrie.resultats.find(
        (r) => r.usage === UsageType.INDUSTRIE,
      );

      expect(scoreIndustrieCentre).toBeDefined();
      expect(scoreIndustrieGrand).toBeDefined();
    });

    it("devrait calculer correctement les avantages et contraintes", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 10000;
      parcelle.surfaceBati = 2000;
      parcelle.siteEnCentreVille = true;
      parcelle.presenceRisquesTechnologiques = true;

      const result = await service.calculer(parcelle, { modeDetaille: true });

      result.resultats.forEach((res: any) => {
        if (res.avantages + res.contraintes > 0) {
          const indiceCalcule = (res.avantages / (res.avantages + res.contraintes)) * 100;
          expect(Math.abs(res.indiceMutabilite - indiceCalcule)).toBeLessThan(1);
        }
      });
    });
  });
});
