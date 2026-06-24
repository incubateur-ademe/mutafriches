import { describe, expect, it } from "vitest";
import { getImpactCritere } from "./impact.labels";

describe("getImpactCritere", () => {
  it("traduit chaque palier de score en niveau et libellé", () => {
    expect(getImpactCritere(2)).toEqual({ label: "Très positif", niveau: "tres-positif" });
    expect(getImpactCritere(1)).toEqual({ label: "Positif", niveau: "positif" });
    expect(getImpactCritere(0.5)).toEqual({ label: "Neutre", niveau: "neutre" });
    expect(getImpactCritere(-1)).toEqual({ label: "Négatif", niveau: "negatif" });
    expect(getImpactCritere(-2)).toEqual({ label: "Très négatif", niveau: "tres-negatif" });
  });

  it("considère un score nul comme neutre", () => {
    expect(getImpactCritere(0).niveau).toBe("neutre");
  });
});
