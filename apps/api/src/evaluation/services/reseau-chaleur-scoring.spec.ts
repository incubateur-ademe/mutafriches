import { UsageResultatDetaille, UsageType } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService } from "./calcul.service";

/**
 * Régression du critère `distanceReseauChaleur` (v1.13).
 *
 * Deux pièges couverts ici :
 * 1. l'unité — la valeur reste en MÈTRES jusqu'à la matrice (seuil 500), contrairement à
 *    l'autoroute et au raccordement électrique qui passent par `metresVersKm`. Une conversion
 *    par mimétisme placerait tous les sites sous le seuil, sans erreur visible ;
 * 2. la sémantique de `null` — « aucune distance exploitable » est scoré comme « >= 500 m »,
 *    et non ignoré, sinon un site sans réseau connu et un site simplement éloigné n'obtiennent
 *    pas le même indice.
 */
describe("Scoring de la distance au réseau de chaleur", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const siteAvecDistance = (distanceReseauChaleur: number | null | undefined): Site => {
    const evaluation = new EvaluationBuilder()
      .withEnrichissement({ distanceReseauChaleur })
      .build();
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
    ].find((d) => d.critere === "distanceReseauChaleur");
  };

  it("valorise fortement les usages bâtis sous 500 m", async () => {
    const site = siteAvecDistance(320);

    expect((await detailCritere(site, UsageType.RESIDENTIEL))?.scoreBrut).toBe(2);
    expect((await detailCritere(site, UsageType.EQUIPEMENTS))?.scoreBrut).toBe(2);
    expect((await detailCritere(site, UsageType.CULTURE))?.scoreBrut).toBe(2);
    expect((await detailCritere(site, UsageType.TERTIAIRE))?.scoreBrut).toBe(1);
    expect((await detailCritere(site, UsageType.INDUSTRIE))?.scoreBrut).toBe(0.5);
    expect((await detailCritere(site, UsageType.RENATURATION))?.scoreBrut).toBe(0.5);
    expect((await detailCritere(site, UsageType.PHOTOVOLTAIQUE))?.scoreBrut).toBe(0.5);
  });

  it("reste neutre sur les sept usages au-delà du seuil", async () => {
    const site = siteAvecDistance(622);

    for (const usage of Object.values(UsageType)) {
      expect((await detailCritere(site, usage))?.scoreBrut).toBe(0.5);
    }
  });

  // Le seuil est en mètres : une conversion en km rendrait toute valeur < 500 et donc
  // TRES_POSITIF partout, sans qu'aucun autre test ne le détecte.
  describe("frontières du seuil de 500 m", () => {
    it.each([
      [1, 2],
      [499, 2],
      [500, 0.5],
      [501, 0.5],
      [5000, 0.5],
    ])("%d m → Résidentiel scoreBrut %d", async (metres, attendu) => {
      const site = siteAvecDistance(metres);
      expect((await detailCritere(site, UsageType.RESIDENTIEL))?.scoreBrut).toBe(attendu);
    });
  });

  it("score une distance nulle comme un site au-delà du seuil, sans l'ignorer", async () => {
    const sansDistance = await detailCritere(siteAvecDistance(null), UsageType.RESIDENTIEL);
    const eloigne = await detailCritere(siteAvecDistance(800), UsageType.RESIDENTIEL);

    expect(sansDistance?.scoreBrut).toBe(0.5);
    expect(sansDistance?.scoreBrut).toBe(eloigne?.scoreBrut);
  });

  it("donne le même indice à un site sans distance qu'à un site éloigné", async () => {
    const indices = async (distance: number | null) => {
      const res = await service.calculer(siteAvecDistance(distance));
      return res.resultats.map((r) => r.indiceMutabilite);
    };

    expect(await indices(null)).toEqual(await indices(800));
  });

  it("ignore le critère quand la donnée est indisponible", async () => {
    const site = siteAvecDistance(undefined);
    const detail = await detailCritere(site, UsageType.RESIDENTIEL);

    // Présent en critère vide (donc affiché "Non disponible"), mais sans effet sur le score.
    expect(detail?.scoreBrut).toBe(0);
  });

  // `null` = recherche effectuée, aucun résultat → compte comme renseigné ; `undefined` =
  // donnée indisponible → ne compte pas. La note étant arrondie au 0,5, l'écart d'un poids 1
  // sur 33 se lit sur poidsRenseignes, pas sur la note.
  it("compte une distance nulle dans la fiabilité, contrairement à une donnée indisponible", async () => {
    const avecNull = await service.calculer(siteAvecDistance(null));
    const sansDonnee = await service.calculer(siteAvecDistance(undefined));

    expect(avecNull.fiabilite.poidsTotal).toBe(33);
    expect(sansDonnee.fiabilite.poidsTotal).toBe(33);
    expect(avecNull.fiabilite.poidsRenseignes).toBe(sansDonnee.fiabilite.poidsRenseignes + 1);
  });
});
