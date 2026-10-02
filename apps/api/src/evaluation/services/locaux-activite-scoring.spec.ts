import {
  EnrichissementOutputDto,
  UsageResultatDetaille,
  UsageType,
} from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService } from "./calcul.service";

// v1.17 : rééquilibrage des locaux d'activité (usage `tertiaire`) vers l'artisanat et les PME
describe("Scoring des locaux d'activité", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const site = (enrichissement: Partial<EnrichissementOutputDto>): Site => {
    const evaluation = new EvaluationBuilder().withEnrichissement(enrichissement).build();
    return Site.fromEnrichissement(
      evaluation.donneesEnrichissement,
      evaluation.donneesComplementaires,
    );
  };

  const scoreTertiaire = async (
    s: Site,
    critere: string,
    versionAlgorithme?: string,
  ): Promise<number | undefined> => {
    const res = await service.calculer(s, { modeDetaille: true, versionAlgorithme });
    const details = (res.resultats as UsageResultatDetaille[]).find(
      (r) => r.usage === UsageType.TERTIAIRE,
    )?.detailsCalcul;
    return [...(details?.detailsAvantages ?? []), ...(details?.detailsContraintes ?? [])].find(
      (d) => d.critere === critere,
    )?.scoreBrut;
  };

  describe("centre-ville", () => {
    it("est neutre en centre-ville et positif hors centre", async () => {
      expect(await scoreTertiaire(site({ siteEnCentreVille: true }), "siteEnCentreVille")).toBe(
        0.5,
      );
      expect(await scoreTertiaire(site({ siteEnCentreVille: false }), "siteEnCentreVille")).toBe(1);
    });

    it("conserve l'ancien scoring en v1.16", async () => {
      const ancien = (enCentre: boolean) =>
        scoreTertiaire(site({ siteEnCentreVille: enCentre }), "siteEnCentreVille", "v1.16");
      expect(await ancien(true)).toBe(1);
      expect(await ancien(false)).toBe(-1);
    });
  });

  describe("surface du site", () => {
    it.each([
      [5000, 1],
      [14999, 1],
      [15000, 0.5],
      [40000, 0.5],
      [80000, 0.5],
    ])("%i m² donne %d", async (surfaceSite, attendu) => {
      expect(await scoreTertiaire(site({ surfaceSite }), "surfaceSite")).toBe(attendu);
    });

    it("conserve l'ancien scoring en v1.16", async () => {
      expect(await scoreTertiaire(site({ surfaceSite: 5000 }), "surfaceSite", "v1.16")).toBe(0.5);
      expect(await scoreTertiaire(site({ surfaceSite: 40000 }), "surfaceSite", "v1.16")).toBe(-1);
    });
  });

  describe("commerces et services", () => {
    it("est positif à proximité et neutre en leur absence", async () => {
      const score = (proximite: boolean) =>
        scoreTertiaire(
          site({ proximiteCommercesServices: proximite }),
          "proximiteCommercesServices",
        );
      expect(await score(true)).toBe(1);
      expect(await score(false)).toBe(0.5);
    });

    it("conserve l'ancien scoring en v1.16", async () => {
      expect(
        await scoreTertiaire(
          site({ proximiteCommercesServices: false }),
          "proximiteCommercesServices",
          "v1.16",
        ),
      ).toBe(-1);
    });
  });
});
