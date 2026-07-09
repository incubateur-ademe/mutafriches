import { describe, it, expect, beforeEach } from "vitest";
import { UsageType, UsageResultatDetaille } from "@mutafriches/shared-types";
import { CalculService } from "./calcul.service";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { Site } from "../entities/site.entity";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { metresVersKm } from "./algorithme/distance.utils";

/**
 * Régression : les distances `distanceAutoroute` et `distanceRaccordementElectrique`
 * sont stockées en MÈTRES par l'enrichissement live, mais la matrice les score en KM.
 * La conversion doit se faire à la frontière de l'algorithme (extraireCriteres).
 */
describe("Unité des distances (mètres → km à la frontière de l'algo)", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  // Construit un site complet valide, en surchargeant les deux distances (en mètres).
  const siteEnMetres = (autorouteM: number, raccordementM: number): Site => {
    const evaluation = new EvaluationBuilder()
      .withEnrichissement({
        distanceAutoroute: autorouteM,
        distanceRaccordementElectrique: raccordementM,
      })
      .build();
    return Site.fromEnrichissement(
      evaluation.donneesEnrichissement,
      evaluation.donneesComplementaires,
    );
  };

  // Récupère le scoreBrut d'un critère de distance pour un usage donné (mode détaillé).
  const scoreBrutCritere = async (
    site: Site,
    usage: UsageType,
    critere: string,
  ): Promise<number | undefined> => {
    const res = await service.calculer(site, { modeDetaille: true });
    const usageResult = (res.resultats as UsageResultatDetaille[]).find((r) => r.usage === usage);
    const details = usageResult?.detailsCalcul;
    const detail = [
      ...(details?.detailsAvantages ?? []),
      ...(details?.detailsContraintes ?? []),
    ].find((d) => d.critere === critere);
    return detail?.scoreBrut;
  };

  it("score un site à 3000 m d'autoroute dans la tranche 2-5 km (et non > 5 km)", async () => {
    const site = siteEnMetres(3000, 300);
    // 3000 m = 3 km → tranche 2-5 km : Industrie NEGATIF (-1), pas TRES_NEGATIF (-2)
    expect(await scoreBrutCritere(site, UsageType.INDUSTRIE, "distanceAutoroute")).toBe(-1);
    // Photovoltaïque POSITIF (+1) sur cette tranche
    expect(await scoreBrutCritere(site, UsageType.PHOTOVOLTAIQUE, "distanceAutoroute")).toBe(1);
  });

  it("score un raccordement à 300 m comme un avantage fort pour le photovoltaïque", async () => {
    const site = siteEnMetres(3000, 300);
    // 300 m = 0,3 km → < 1 km : Photovoltaïque TRES_POSITIF (+2), pas TRES_NEGATIF (-2)
    expect(
      await scoreBrutCritere(site, UsageType.PHOTOVOLTAIQUE, "distanceRaccordementElectrique"),
    ).toBe(2);
  });

  // T2 : table de seuils m ↔ km aux bornes exactes.
  describe("frontières de seuils (mètres)", () => {
    it.each([
      [999, 2], // < 1 km  → TRES_POSITIF
      [1000, 1], // 1-2 km → POSITIF
      [1999, 1],
      [2000, -1], // 2-5 km → NEGATIF
      [4999, -1],
      [5000, -2], // > 5 km → TRES_NEGATIF
    ])("autoroute %d m → Industrie scoreBrut %d", async (metres, attendu) => {
      const site = siteEnMetres(metres, 300);
      expect(await scoreBrutCritere(site, UsageType.INDUSTRIE, "distanceAutoroute")).toBe(attendu);
    });

    it.each([
      [999, 2], // < 1 km  → TRES_POSITIF
      [1000, -1], // 1-5 km → NEGATIF
      [4999, -1],
      [5000, -2], // > 5 km → TRES_NEGATIF
    ])("raccordement %d m → Photovoltaïque scoreBrut %d", async (metres, attendu) => {
      const site = siteEnMetres(3000, metres);
      expect(
        await scoreBrutCritere(site, UsageType.PHOTOVOLTAIQUE, "distanceRaccordementElectrique"),
      ).toBe(attendu);
    });
  });

  // T3 : sémantique null/undefined préservée (le critère reste ignoré).
  describe("metresVersKm préserve null/undefined", () => {
    it("undefined reste undefined", () => {
      expect(metresVersKm(undefined)).toBeUndefined();
    });
    it("null reste null", () => {
      expect(metresVersKm(null)).toBeNull();
    });
    it("convertit un nombre en km", () => {
      expect(metresVersKm(3000)).toBe(3);
      expect(metresVersKm(300)).toBe(0.3);
    });
  });
});
