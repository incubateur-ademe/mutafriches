import { describe, expect, it } from "vitest";
import { EnrichissementOutputDto } from "../enrichissement";
import { DonneesComplementairesInputDto, UsageResultatDetaille, UsageType } from "../evaluation";
import { EtatBatiInfrastructure, TypeProprietaire } from "../evaluation/enums";
import { buildDetailUsage } from "./detail-usage.builder";

const enrichissement = {
  surfaceSite: 11700,
} as EnrichissementOutputDto;

const complementaires: Partial<DonneesComplementairesInputDto> = {
  typeProprietaire: TypeProprietaire.MIXTE,
  etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
};

const usage: UsageResultatDetaille = {
  rang: 1,
  usage: UsageType.RENATURATION,
  indiceMutabilite: 80,
  avantages: 17.3,
  contraintes: 7.3,
  detailsCalcul: {
    detailsAvantages: [
      { critere: "surfaceSite", valeur: 11700, scoreBrut: 1, poids: 2, scorePondere: 2 },
      { critere: "typeProprietaire", valeur: "mixte", scoreBrut: 1, poids: 1, scorePondere: 1 },
    ],
    detailsContraintes: [
      {
        critere: "etatBatiInfrastructure",
        valeur: "degradation-moyenne",
        scoreBrut: -1,
        poids: 2,
        scorePondere: -2,
      },
    ],
    detailsCriteresVides: [],
    totalAvantages: 17.3,
    totalContraintes: 7.3,
  },
};

describe("buildDetailUsage", () => {
  it("groupe les critères du calcul par section", () => {
    const sections = buildDetailUsage(usage, enrichissement, complementaires);
    expect(sections.map((s) => s.id)).toEqual(["site-bati"]);
    expect(sections[0].criteres.map((c) => c.key)).toEqual([
      "surfaceSite",
      "typeProprietaire",
      "etatBatiInfrastructure",
    ]);
  });

  it("reprend le poids du calcul et traduit l'impact", () => {
    const criteres = buildDetailUsage(usage, enrichissement, complementaires).flatMap(
      (s) => s.criteres,
    );
    const etat = criteres.find((c) => c.key === "etatBatiInfrastructure");
    expect(etat?.poids).toBe(2);
    expect(etat?.impact).toEqual({ label: "Négatif", niveau: "negatif" });
  });

  it("résout les valeurs affichées comme le récapitulatif", () => {
    const criteres = buildDetailUsage(usage, enrichissement, complementaires).flatMap(
      (s) => s.criteres,
    );
    expect(criteres.find((c) => c.key === "typeProprietaire")?.valeurAffichee).toBe(
      "Mixte public et privé",
    );
    expect(criteres.find((c) => c.key === "etatBatiInfrastructure")?.valeurAffichee).toBe(
      "Bâti moyennement dégradé",
    );
  });

  it("ignore les critères absents du calcul de l'usage", () => {
    const sections = buildDetailUsage(usage, enrichissement, complementaires);
    const total = sections.reduce((n, s) => n + s.criteres.length, 0);
    expect(total).toBe(3);
  });
});
