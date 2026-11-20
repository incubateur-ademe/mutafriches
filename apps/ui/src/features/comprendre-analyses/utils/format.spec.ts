import { describe, expect, it } from "vitest";
import { USAGE_LABELS } from "@mutafriches/shared-types";
import { avecCesures, formatEvolution, formatPoids, formatScore } from "./format";

describe("format (Comprendre les analyses)", () => {
  it("signe les scores, sauf le neutre", () => {
    expect([2, 1, 0.5, -1, -2].map(formatScore)).toEqual(["+2", "+1", "0,5", "−1", "−2"]);
  });

  it("formate le coefficient en français", () => {
    expect(formatPoids(0.5)).toBe("0,5");
    expect(formatPoids(2)).toBe("2");
  });

  it("ajoute une césure discrète au mot trop long, sans changer le libellé lu", () => {
    const libelle = avecCesures("Centrale photovoltaïque au sol");
    expect(libelle).toBe("Centrale photo\u00ADvoltaïque au sol");
    expect(libelle.replace("\u00AD", "")).toBe("Centrale photovoltaïque au sol");
  });

  it("laisse intacts les libellés d'usage sans mot à couper", () => {
    const sansCesure = Object.values(USAGE_LABELS).filter((l) => !l.includes("photovoltaïque"));
    expect(sansCesure.length).toBeGreaterThan(0);
    for (const libelle of sansCesure) {
      expect(avecCesures(libelle)).toBe(libelle);
    }
  });

  it("couvre le libellé d'usage qui porte le mot à couper", () => {
    expect(Object.values(USAGE_LABELS).some((l) => avecCesures(l) !== l)).toBe(true);
  });

  it("décrit l'évolution d'un critère", () => {
    expect(formatEvolution({ versionAjout: "v1.1", versionsModification: [] })).toBe("v1.1");
    expect(formatEvolution({ versionAjout: "v1.18", versionsModification: ["v1.19"] })).toBe(
      "v1.18 ; modif. v1.19",
    );
  });
});
