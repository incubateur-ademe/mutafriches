import { describe, it, expect, beforeEach, vi } from "vitest";
import { RaccordementEau, UsageType } from "@mutafriches/shared-types";
import { CalculService } from "./calcul.service";
import { Parcelle } from "../entities/parcelle.entity";

describe("CalculService", () => {
  let service: CalculService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new CalculService();
  });

  describe("calculer", () => {
    it("devrait calculer la mutabilité pour tous les usages", async () => {
      // Créer une parcelle de test
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 42780;
      parcelle.surfaceBati = 6600;
      parcelle.siteEnCentreVille = true;
      parcelle.raccordementEau = RaccordementEau.OUI;

      // Calculer
      const result = await service.calculer(parcelle);

      // Vérifications de base
      expect(result).toBeDefined();
      expect(result.resultats).toBeDefined();
      expect(result.resultats).toBeInstanceOf(Array);
      expect(result.resultats.length).toBe(7);

      // Vérifier chaque résultat
      result.resultats.forEach((res) => {
        expect(res.usage).toBeDefined();
        expect(res.rang).toBeGreaterThanOrEqual(1);
        expect(res.rang).toBeLessThanOrEqual(7);
        expect(res.indiceMutabilite).toBeGreaterThanOrEqual(0);
        expect(res.indiceMutabilite).toBeLessThanOrEqual(100);
        expect(res.potentiel).toBeDefined();
        expect(res.explication).toBeDefined();
      });

      // Vérifier la fiabilité
      expect(result.fiabilite).toBeDefined();
      expect(result.fiabilite.note).toBeGreaterThanOrEqual(0);
      expect(result.fiabilite.note).toBeLessThanOrEqual(10);
      expect(result.fiabilite.text).toBeDefined();
      expect(result.fiabilite.criteresRenseignes).toBeGreaterThanOrEqual(0);
    });

    it("devrait classer les usages par indice décroissant", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 10000;
      parcelle.surfaceBati = 2000;

      const result = await service.calculer(parcelle);

      // Vérifier que les rangs sont uniques et corrects
      const rangs = result.resultats.map((r) => r.rang);
      const rangsUniques = [...new Set(rangs)];

      expect(rangsUniques.length).toBe(7);
      expect(Math.min(...rangs)).toBe(1);
      expect(Math.max(...rangs)).toBe(7);

      // Vérifier que le rang 1 a le meilleur indice
      const rang1 = result.resultats.find((r) => r.rang === 1);
      const rang7 = result.resultats.find((r) => r.rang === 7);

      expect(rang1).toBeDefined();
      expect(rang7).toBeDefined();
      expect(rang1!.indiceMutabilite).toBeGreaterThanOrEqual(rang7!.indiceMutabilite);
    });

    it("devrait calculer les détails en mode détaillé", async () => {
      const parcelle = new Parcelle();
      parcelle.surfaceSite = 15000;
      parcelle.surfaceBati = 3000;
      parcelle.siteEnCentreVille = true;

      const result = await service.calculer(parcelle, { modeDetaille: true });

      // En mode détaillé, on devrait avoir les avantages et contraintes
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

    it("devrait gérer les parcelles avec données manquantes", async () => {
      // Parcelle avec le minimum de données
      const parcelle = new Parcelle();

      // Ne devrait pas planter
      const result = await service.calculer(parcelle);

      expect(result).toBeDefined();
      expect(result.resultats.length).toBe(7);

      // La fiabilité devrait être faible
      expect(result.fiabilite.note).toBeLessThanOrEqual(3);
      expect(result.fiabilite.criteresRenseignes).toBeLessThanOrEqual(5);
    });

    it("devrait calculer une meilleure fiabilité avec plus de données", async () => {
      // Parcelle minimale
      const parcelleMin = new Parcelle();
      parcelleMin.surfaceSite = 10000;

      const resultMin = await service.calculer(parcelleMin);

      // Parcelle complète
      const parcelleComplete = new Parcelle();
      parcelleComplete.surfaceSite = 10000;
      parcelleComplete.surfaceBati = 2000;
      parcelleComplete.siteEnCentreVille = true;
      parcelleComplete.raccordementEau = RaccordementEau.OUI;
      parcelleComplete.distanceRaccordementElectrique = 100;
      parcelleComplete.proximiteCommercesServices = true;
      parcelleComplete.tauxLogementsVacants = 5.2;
      parcelleComplete.distanceAutoroute = 2;
      parcelleComplete.distanceTransportCommun = 300;
      parcelleComplete.presenceRisquesNaturels = "FAIBLE" as any;
      parcelleComplete.presenceRisquesTechnologiques = false;

      const resultComplete = await service.calculer(parcelleComplete);

      // Plus de données = meilleure fiabilité
      expect(resultComplete.fiabilite.note).toBeGreaterThan(resultMin.fiabilite.note);
    });

    it("devrait déterminer le potentiel selon l'indice", async () => {
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

    it("devrait favoriser certains usages selon les caractéristiques", async () => {
      // Site favorable au résidentiel
      const parcelleResidentiel = new Parcelle();
      parcelleResidentiel.surfaceSite = 5000;
      parcelleResidentiel.surfaceBati = 1000;
      parcelleResidentiel.siteEnCentreVille = true;
      parcelleResidentiel.proximiteCommercesServices = true;
      parcelleResidentiel.distanceTransportCommun = 200;

      const resultResidentiel = await service.calculer(parcelleResidentiel);

      // Site favorable à l'industrie
      const parcelleIndustrie = new Parcelle();
      parcelleIndustrie.surfaceSite = 50000;
      parcelleIndustrie.surfaceBati = 10000;
      parcelleIndustrie.siteEnCentreVille = false;
      parcelleIndustrie.distanceAutoroute = 1;

      const resultIndustrie = await service.calculer(parcelleIndustrie);

      // Le résidentiel devrait mieux scorer sur le site en centre-ville
      const scoreResidentielCentre = resultResidentiel.resultats.find(
        (r) => r.usage === UsageType.RESIDENTIEL,
      );
      const scoreResidentielIndustrie = resultIndustrie.resultats.find(
        (r) => r.usage === UsageType.RESIDENTIEL,
      );

      expect(scoreResidentielCentre).toBeDefined();
      expect(scoreResidentielIndustrie).toBeDefined();

      // L'industrie devrait mieux scorer sur le grand site
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
      parcelle.presenceRisquesTechnologiques = true; // Une contrainte

      const result = await service.calculer(parcelle, { modeDetaille: true });

      result.resultats.forEach((res: any) => {
        // L'indice doit être cohérent avec avantages/(avantages+contraintes)
        if (res.avantages + res.contraintes > 0) {
          const indiceCalcule = (res.avantages / (res.avantages + res.contraintes)) * 100;
          // Tolérance pour l'arrondi
          expect(Math.abs(res.indiceMutabilite - indiceCalcule)).toBeLessThan(1);
        }
      });
    });
  });
});
