import { UsageResultatDetaille, UsageType } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService } from "./calcul.service";

/**
 * Régression du retrait de la distance sentinelle Enedis (999 km).
 *
 * L'adapter renvoyait 999 000 m quand aucune infrastructure n'était trouvée dans ses rayons
 * de recherche ; la valeur remontait telle quelle jusqu'à l'écran (« 999 000 M »). Elle est
 * remplacée par `null`, ramené à la tranche « au-delà de 5 km » à la frontière de l'algorithme.
 * Le scoring doit rester rigoureusement identique : ce n'est pas un changement d'algorithme.
 */
describe("Distance de raccordement électrique hors rayon de recherche", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const site = (distanceRaccordementElectrique: number | null): Site => {
    const evaluation = new EvaluationBuilder()
      .withEnrichissement({ distanceRaccordementElectrique })
      .build();
    return Site.fromEnrichissement(
      evaluation.donneesEnrichissement,
      evaluation.donneesComplementaires,
    );
  };

  it("score une distance nulle exactement comme l'ancienne sentinelle de 999 km", async () => {
    const avecNull = await service.calculer(site(null));
    const avecSentinelle = await service.calculer(site(999000));

    expect(avecNull.resultats.map((r) => r.indiceMutabilite)).toEqual(
      avecSentinelle.resultats.map((r) => r.indiceMutabilite),
    );
    expect(avecNull.fiabilite.poidsRenseignes).toBe(avecSentinelle.fiabilite.poidsRenseignes);
  });

  it("place le site dans la tranche au-delà de 5 km, la plus défavorable au photovoltaïque", async () => {
    const res = await service.calculer(site(null), { modeDetaille: true });
    const pv = (res.resultats as UsageResultatDetaille[]).find(
      (r) => r.usage === UsageType.PHOTOVOLTAIQUE,
    );
    const detail = [
      ...(pv?.detailsCalcul?.detailsAvantages ?? []),
      ...(pv?.detailsCalcul?.detailsContraintes ?? []),
    ].find((d) => d.critere === "distanceRaccordementElectrique");

    expect(detail?.scoreBrut).toBe(-2);
  });

  it("compte la distance nulle dans la fiabilité, contrairement à une donnée indisponible", async () => {
    const avecNull = await service.calculer(site(null));
    const sansDonnee = await service.calculer(site(undefined as unknown as null));

    expect(avecNull.fiabilite.poidsRenseignes).toBe(sansDonnee.fiabilite.poidsRenseignes + 1);
  });
});
