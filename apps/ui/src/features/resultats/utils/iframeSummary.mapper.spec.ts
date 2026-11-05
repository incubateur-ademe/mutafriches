import { describe, expect, it } from "vitest";
import {
  EnrichissementOutputDto,
  MutabiliteOutputDto,
  UsageResultat,
  UsageType,
  VERSION_ALGO,
} from "@mutafriches/shared-types";
import { buildIframeEvaluationSummary } from "./iframeSummary.mapper";

const resultat = (usage: UsageType, rang: number): UsageResultat => ({
  usage,
  rang,
  indiceMutabilite: 80 - rang,
  potentiel: "Bon",
});

const resultats = (evaluationId?: string): MutabiliteOutputDto =>
  ({
    fiabilite: { note: 8.5, text: "Fiable" },
    resultats: [
      resultat(UsageType.RESIDENTIEL, 1),
      resultat(UsageType.EQUIPEMENTS, 2),
      resultat(UsageType.CULTURE, 3),
      resultat(UsageType.TERTIAIRE, 4),
    ],
    evaluationId,
  }) as MutabiliteOutputDto;

const enrichissement = (identifiantsParcelles?: string[]): EnrichissementOutputDto =>
  ({ identifiantsParcelles }) as EnrichissementOutputDto;

describe("buildIframeEvaluationSummary", () => {
  it("pointe retrieveUrl vers GET /evaluation/:id", () => {
    const resume = buildIframeEvaluationSummary(
      resultats("eval-123"),
      enrichissement(["49020000AK0118"]),
      "49020000AK0118",
    );

    expect(resume.evaluationId).toBe("eval-123");
    expect(resume.retrieveUrl).toBe("/evaluation/eval-123");
  });

  it("omet retrieveUrl sans identifiant d'évaluation", () => {
    const resume = buildIframeEvaluationSummary(resultats(), undefined, "49020000AK0118");

    expect(resume.retrieveUrl).toBeUndefined();
  });

  it("renvoie le tableau des parcelles en multi-parcelle", () => {
    const parcelles = ["49020000AK0118", "49020000AK0119"];
    const resume = buildIframeEvaluationSummary(
      resultats("eval-123"),
      enrichissement(parcelles),
      parcelles.join(","),
    );

    expect(resume.identifiantParcelle).toBe("49020000AK0118,49020000AK0119");
    expect(resume.identifiantsParcelles).toEqual(parcelles);
  });

  it("déduit les parcelles de l'identifiant du site si l'enrichissement ne les porte pas", () => {
    const resume = buildIframeEvaluationSummary(
      resultats("eval-123"),
      enrichissement(),
      "49020000AK0118,49020000AK0119",
    );

    expect(resume.identifiantsParcelles).toEqual(["49020000AK0118", "49020000AK0119"]);
  });

  it("résume l'usage principal, le podium et la version d'algorithme", () => {
    const resume = buildIframeEvaluationSummary(resultats("eval-123"), undefined, "49020000AK0118");

    expect(resume.usagePrincipal).toEqual({
      usage: UsageType.RESIDENTIEL,
      indiceMutabilite: 79,
      potentiel: "Bon",
    });
    expect(resume.top3Usages.map((u) => u.rang)).toEqual([1, 2, 3]);
    expect(resume.metadata?.versionAlgorithme).toBe(VERSION_ALGO);
  });
});
