import { UsageResultatDetaille, UsageType } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService } from "./calcul.service";

/**
 * Régression du critère `siteEnQpv` (v1.14).
 *
 * Trois pièges couverts ici :
 * 1. la clé de matrice — `MATRICE_SCORING` est indexée par `String(valeur)`, donc `"true"` et
 *    `"false"`. Une clé mal formée ferait retomber dans la branche qui retourne `null`, et le
 *    critère serait silencieusement ignoré, sans échec de test ailleurs ;
 * 2. la sémantique de `false` — « site hors QPV » est une réponse à part entière, scorée et
 *    comptée dans la fiabilité, à la différence de `undefined` (donnée indisponible). Un
 *    ternaire dans `copierDonneesEnrichies` transformerait `false` en `undefined` pour la
 *    quasi-totalité du parc, sans rien casser d'autre ;
 * 3. « neutre » n'est pas « sans effet » — le score NEUTRE alimente avantages ET contraintes,
 *    donc un site hors QPV voit malgré tout ses indices bouger.
 */
describe("Scoring du quartier prioritaire de la ville", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const siteAvecQpv = (siteEnQpv: boolean | undefined): Site => {
    const evaluation = new EvaluationBuilder().withEnrichissement({ siteEnQpv }).build();
    return Site.fromEnrichissement(
      evaluation.donneesEnrichissement,
      evaluation.donneesComplementaires,
    );
  };

  const detailCritere = async (site: Site, usage: UsageType) => {
    const res = await service.calculer(site, { modeDetaille: true });
    const usageResult = (res.resultats as UsageResultatDetaille[]).find((r) => r.usage === usage);
    const details = usageResult?.detailsCalcul;
    return [
      ...(details?.detailsAvantages ?? []),
      ...(details?.detailsContraintes ?? []),
      ...(details?.detailsCriteresVides ?? []),
    ].find((d) => d.critere === "siteEnQpv");
  };

  it("valorise le résidentiel et les équipements, pénalise tertiaire et photovoltaïque", async () => {
    const site = siteAvecQpv(true);

    expect((await detailCritere(site, UsageType.RESIDENTIEL))?.scoreBrut).toBe(2);
    expect((await detailCritere(site, UsageType.EQUIPEMENTS))?.scoreBrut).toBe(2);
    expect((await detailCritere(site, UsageType.CULTURE))?.scoreBrut).toBe(0.5);
    expect((await detailCritere(site, UsageType.TERTIAIRE))?.scoreBrut).toBe(-2);
    expect((await detailCritere(site, UsageType.INDUSTRIE))?.scoreBrut).toBe(0.5);
    expect((await detailCritere(site, UsageType.RENATURATION))?.scoreBrut).toBe(0.5);
    expect((await detailCritere(site, UsageType.PHOTOVOLTAIQUE))?.scoreBrut).toBe(-1);
  });

  it("reste neutre sur les sept usages hors quartier prioritaire", async () => {
    const site = siteAvecQpv(false);

    for (const usage of Object.values(UsageType)) {
      expect((await detailCritere(site, usage))?.scoreBrut).toBe(0.5);
    }
  });

  it("score le critère quand le site est hors QPV, au lieu de l'ignorer", async () => {
    // `false` doit atteindre la matrice : s'il était traité comme une absence de donnée, le
    // critère basculerait dans les critères vides et ne pèserait plus sur l'indice.
    const site = siteAvecQpv(false);

    const detail = await detailCritere(site, UsageType.RESIDENTIEL);

    expect(detail).toBeDefined();
    expect(detail?.scoreBrut).toBe(0.5);
  });

  it("compte un site hors QPV dans la fiabilité, contrairement à une donnée indisponible", async () => {
    const horsQpv = await service.calculer(siteAvecQpv(false));
    const sansDonnee = await service.calculer(siteAvecQpv(undefined));

    expect(horsQpv.fiabilite.poidsTotal).toBe(32);
    expect(sansDonnee.fiabilite.poidsTotal).toBe(32);
    expect(horsQpv.fiabilite.poidsRenseignes).toBe(sansDonnee.fiabilite.poidsRenseignes + 1);
  });
});
