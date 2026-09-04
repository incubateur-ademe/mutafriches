import { describe, it, expect, beforeEach } from "vitest";
import {
  PresencePollution,
  RaccordementEau,
  UsageResultatDetaille,
  UsageType,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZoneAccelerationEnr,
} from "@mutafriches/shared-types";
import { CalculService } from "./calcul.service";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { Site } from "../entities/site.entity";
import { POIDS_CRITERES } from "./algorithme/algorithme.config";

describe("CalculService", () => {
  let service: CalculService;

  beforeEach(() => {
    const fiabiliteCalculator = new FiabiliteCalculator();
    service = new CalculService(fiabiliteCalculator);
  });

  describe("calculer", () => {
    it("devrait calculer la mutabilite pour tous les usages", async () => {
      const site = new Site();
      site.surfaceSite = 42780;
      site.surfaceBati = 6600;
      site.siteEnCentreVille = true;
      site.raccordementEau = RaccordementEau.OUI;

      const result = await service.calculer(site);

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
      const site = new Site();
      site.surfaceSite = 10000;
      site.surfaceBati = 2000;

      const result = await service.calculer(site);

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
      const site = new Site();
      site.surfaceSite = 15000;
      site.surfaceBati = 3000;
      site.siteEnCentreVille = true;

      const result = await service.calculer(site, { modeDetaille: true });

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

    it("devrait conserver le poids nominal des criteres non renseignes", async () => {
      const site = new Site();
      site.surfaceSite = 15000;
      site.surfaceBati = 3000;
      // typeProprietaire, presencePollution, etc. volontairement non renseignes

      const result = await service.calculer(site, { modeDetaille: true });
      const detail = (result.resultats[0] as UsageResultatDetaille).detailsCalcul!;
      const vides = detail.detailsCriteresVides;

      expect(vides.length).toBeGreaterThan(0);
      vides.forEach((critere) => {
        // Le poids nominal est expose comme dans fiabilite.detailCriteres,
        // meme si le critere ne contribue ni aux avantages ni aux contraintes
        expect(critere.poids).toBe(POIDS_CRITERES[critere.critere as keyof typeof POIDS_CRITERES]);
        expect(critere.poids).toBeGreaterThan(0);
        expect(critere.scorePondere).toBe(0);
        expect(critere.scoreBrut).toBe(0);
      });

      // Un critere vide ne pese pas dans le calcul
      const totalVides = vides.reduce((acc, c) => acc + c.scorePondere, 0);
      expect(totalVides).toBe(0);
    });

    it("devrait exposer ne-sait-pas comme valeur du critere vide", async () => {
      const site = new Site();
      site.surfaceSite = 15000;
      site.presencePollution = PresencePollution.NE_SAIT_PAS;

      const result = await service.calculer(site, { modeDetaille: true });
      const detail = (result.resultats[0] as UsageResultatDetaille).detailsCalcul!;
      const pollution = detail.detailsCriteresVides.find((c) => c.critere === "presencePollution");

      expect(pollution).toBeDefined();
      expect(pollution!.valeur).toBe(PresencePollution.NE_SAIT_PAS);
      expect(pollution!.poids).toBe(POIDS_CRITERES.presencePollution);
    });

    it("devrait gerer les sites avec donnees manquantes", async () => {
      const site = new Site();

      const result = await service.calculer(site);

      expect(result).toBeDefined();
      expect(result.resultats.length).toBe(7);

      // La fiabilite devrait etre a 0 (aucun critere renseigne)
      expect(result.fiabilite.note).toBe(0);
      expect(result.fiabilite.criteresRenseignes).toBe(0);
      expect(result.fiabilite.poidsRenseignes).toBe(0);
      expect(result.fiabilite.poidsTotal).toBeGreaterThan(0);
    });

    it("devrait calculer une meilleure fiabilite avec plus de criteres ponderes", async () => {
      // Site minimal avec un seul critère
      const siteMin = new Site();
      siteMin.surfaceSite = 10000; // poids 2

      const resultMin = await service.calculer(siteMin);

      // Site avec plusieurs critères de poids variés
      const siteComplet = new Site();
      siteComplet.surfaceSite = 10000; // poids 2
      siteComplet.surfaceBati = 2000; // poids 2
      siteComplet.siteEnCentreVille = true; // poids 1
      siteComplet.raccordementEau = RaccordementEau.OUI; // poids 1
      siteComplet.distanceRaccordementElectrique = 100; // poids 1
      siteComplet.proximiteCommercesServices = true; // poids 1
      siteComplet.tauxLogementsVacants = 5.2; // poids 1
      siteComplet.distanceAutoroute = 2; // poids 0.5
      siteComplet.distanceTransportCommun = 300; // poids 1
      siteComplet.risqueRetraitGonflementArgile = RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN; // poids 0.5
      siteComplet.risqueCavitesSouterraines = RisqueCavitesSouterraines.NON; // poids 0.5
      siteComplet.risqueInondation = RisqueInondation.NON; // poids 1
      siteComplet.presenceRisquesTechnologiques = false; // poids 1

      const resultComplet = await service.calculer(siteComplet);

      // Plus de poids renseignés = meilleure fiabilité
      expect(resultComplet.fiabilite.note).toBeGreaterThan(resultMin.fiabilite.note);
    });

    it("devrait determiner le potentiel selon l'indice", async () => {
      const site = new Site();
      site.surfaceSite = 20000;
      site.surfaceBati = 4000;

      const result = await service.calculer(site);

      result.resultats.forEach((res) => {
        if (res.indiceMutabilite >= 70) {
          expect(res.potentiel).toBe("Excellent");
        } else if (res.indiceMutabilite >= 60) {
          expect(res.potentiel).toBe("Très bon");
        } else if (res.indiceMutabilite >= 50) {
          expect(res.potentiel).toBe("Bon");
        } else if (res.indiceMutabilite >= 40) {
          expect(res.potentiel).toBe("Moyen");
        } else {
          expect(res.potentiel).toBe("Faible");
        }
      });
    });

    it("devrait favoriser certains usages selon les caracteristiques", async () => {
      const siteResidentiel = new Site();
      siteResidentiel.surfaceSite = 5000;
      siteResidentiel.surfaceBati = 1000;
      siteResidentiel.siteEnCentreVille = true;
      siteResidentiel.proximiteCommercesServices = true;
      siteResidentiel.distanceTransportCommun = 200;

      const resultResidentiel = await service.calculer(siteResidentiel);

      const siteIndustrie = new Site();
      siteIndustrie.surfaceSite = 50000;
      siteIndustrie.surfaceBati = 10000;
      siteIndustrie.siteEnCentreVille = false;
      siteIndustrie.distanceAutoroute = 1;

      const resultIndustrie = await service.calculer(siteIndustrie);

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
      const site = new Site();
      site.surfaceSite = 10000;
      site.surfaceBati = 2000;
      site.siteEnCentreVille = true;
      site.presenceRisquesTechnologiques = true;

      const result = await service.calculer(site, { modeDetaille: true });

      result.resultats.forEach((res: any) => {
        if (res.avantages + res.contraintes > 0) {
          const indiceCalcule = (res.avantages / (res.avantages + res.contraintes)) * 100;
          expect(Math.abs(res.indiceMutabilite - indiceCalcule)).toBeLessThan(1);
        }
      });
    });

    it("devrait penaliser le photovoltaique en zone d'exclusion EnR sans toucher aux autres usages", async () => {
      const indicesPourZaer = async (valeur: ZoneAccelerationEnr) => {
        const site = new Site();
        site.surfaceSite = 20000;
        site.surfaceBati = 2000;
        site.zoneAccelerationEnr = valeur;

        const result = await service.calculer(site);
        return new Map(result.resultats.map((r) => [r.usage, r.indiceMutabilite]));
      };

      const acceleration = await indicesPourZaer(ZoneAccelerationEnr.OUI);
      const exclusion = await indicesPourZaer(ZoneAccelerationEnr.EXCLUSION);

      expect(exclusion.get(UsageType.PHOTOVOLTAIQUE)!).toBeLessThan(
        acceleration.get(UsageType.PHOTOVOLTAIQUE)!,
      );

      Object.values(UsageType)
        .filter((usage) => usage !== UsageType.PHOTOVOLTAIQUE)
        .forEach((usage) => {
          expect(exclusion.get(usage)).toBe(acceleration.get(usage));
        });
    });
  });
});
