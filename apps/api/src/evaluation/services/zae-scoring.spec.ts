import { UsageResultatDetaille, UsageType } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService } from "./calcul.service";

// Régression du critère `siteEnZae` (v1.18) : clés de matrice "true"/"false", `false` scoré et
// compté en fiabilité, `undefined` ignoré, absent des versions antérieures.
describe("Scoring de la zone d'activité économique", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const siteAvecZae = (siteEnZae: boolean | undefined): Site => {
    const evaluation = new EvaluationBuilder().withEnrichissement({ siteEnZae }).build();
    return Site.fromEnrichissement(
      evaluation.donneesEnrichissement,
      evaluation.donneesComplementaires,
    );
  };

  const detailCritere = async (site: Site, usage: UsageType, versionAlgorithme?: string) => {
    const res = await service.calculer(site, { modeDetaille: true, versionAlgorithme });
    const usageResult = (res.resultats as UsageResultatDetaille[]).find((r) => r.usage === usage);
    const details = usageResult?.detailsCalcul;
    return [
      ...(details?.detailsAvantages ?? []),
      ...(details?.detailsContraintes ?? []),
      ...(details?.detailsCriteresVides ?? []),
    ].find((d) => d.critere === "siteEnZae");
  };

  it("applique la règle de la matrice en zone d'activité", async () => {
    const site = siteAvecZae(true);
    const attendu: Record<UsageType, number> = {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    };

    for (const usage of Object.values(UsageType)) {
      expect((await detailCritere(site, usage))?.scoreBrut).toBe(attendu[usage]);
    }
  });

  it("reste neutre sur les sept usages hors zone d'activité", async () => {
    const site = siteAvecZae(false);

    for (const usage of Object.values(UsageType)) {
      expect((await detailCritere(site, usage))?.scoreBrut).toBe(0.5);
    }
  });

  it("favorise l'industrie et pénalise le résidentiel en zone d'activité", async () => {
    const indice = async (zae: boolean, usage: UsageType): Promise<number | undefined> => {
      const res = await service.calculer(siteAvecZae(zae));
      return res.resultats.find((r) => r.usage === usage)?.indiceMutabilite;
    };

    expect(await indice(true, UsageType.INDUSTRIE)).toBeGreaterThan(
      (await indice(false, UsageType.INDUSTRIE)) ?? 0,
    );
    expect(await indice(true, UsageType.RESIDENTIEL)).toBeLessThan(
      (await indice(false, UsageType.RESIDENTIEL)) ?? 0,
    );
  });

  it("compte un site hors ZAE dans la fiabilité, contrairement à une donnée indisponible", async () => {
    const horsZae = await service.calculer(siteAvecZae(false));
    const sansDonnee = await service.calculer(siteAvecZae(undefined));

    expect(horsZae.fiabilite.poidsTotal).toBe(34);
    expect(horsZae.fiabilite.poidsRenseignes).toBe(sansDonnee.fiabilite.poidsRenseignes + 1);
  });

  it("ignore le critère dans les versions antérieures à v1.18", async () => {
    const site = siteAvecZae(true);

    expect(await detailCritere(site, UsageType.INDUSTRIE, "v1.17")).toBeUndefined();

    const res = await service.calculer(site, { versionAlgorithme: "v1.17" });
    expect(res.fiabilite.poidsTotal).toBe(33);
  });
});
