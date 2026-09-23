import { UsageResultatDetaille, UsageType } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService } from "./calcul.service";

// Régression du critère `saturationReseauEnr` (v1.15) : clés de matrice "true"/"false",
// `false` scoré et compté en fiabilité, `undefined` ignoré.
describe("Scoring de la saturation du réseau électrique EnR", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const siteAvecSaturation = (saturationReseauEnr: boolean | undefined): Site => {
    const evaluation = new EvaluationBuilder().withEnrichissement({ saturationReseauEnr }).build();
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
    ].find((d) => d.critere === "saturationReseauEnr");
  };

  it("pénalise très fortement le photovoltaïque en zone saturée, neutre ailleurs", async () => {
    const site = siteAvecSaturation(true);

    expect((await detailCritere(site, UsageType.PHOTOVOLTAIQUE))?.scoreBrut).toBe(-2);
    for (const usage of Object.values(UsageType).filter((u) => u !== UsageType.PHOTOVOLTAIQUE)) {
      expect((await detailCritere(site, usage))?.scoreBrut).toBe(0.5);
    }
  });

  it("reste neutre sur les sept usages hors zone saturée", async () => {
    const site = siteAvecSaturation(false);

    for (const usage of Object.values(UsageType)) {
      expect((await detailCritere(site, usage))?.scoreBrut).toBe(0.5);
    }
  });

  it("dégrade l'indice photovoltaïque d'un site en zone saturée", async () => {
    const indicePv = async (saturation: boolean): Promise<number | undefined> => {
      const res = await service.calculer(siteAvecSaturation(saturation));
      return res.resultats.find((r) => r.usage === UsageType.PHOTOVOLTAIQUE)?.indiceMutabilite;
    };

    expect(await indicePv(true)).toBeLessThan((await indicePv(false)) ?? 0);
  });

  it("compte un site non saturé dans la fiabilité, contrairement à une donnée indisponible", async () => {
    const nonSature = await service.calculer(siteAvecSaturation(false));
    const sansDonnee = await service.calculer(siteAvecSaturation(undefined));

    expect(nonSature.fiabilite.poidsTotal).toBe(33);
    expect(nonSature.fiabilite.poidsRenseignes).toBe(sansDonnee.fiabilite.poidsRenseignes + 1);
  });
});
