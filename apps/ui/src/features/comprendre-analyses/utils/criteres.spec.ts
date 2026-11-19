import { describe, expect, it } from "vitest";
import { CRITERES_PAR_COEFFICIENT, descriptionExclusion, libelleCritere } from "./criteres";

describe("critères (Comprendre les analyses)", () => {
  it("trie par coefficient décroissant", () => {
    const poids = CRITERES_PAR_COEFFICIENT.map((c) => c.poids);
    expect(poids).toEqual([...poids].sort((a, b) => b - a));
    expect(CRITERES_PAR_COEFFICIENT[0].cle).toBe("surfaceSite");
  });

  it("reprend le libellé du parcours, avec l'unité", () => {
    expect(libelleCritere({ cle: "surfaceBati", nom: "Emprise au sol du bâti (m²)" })).toBe(
      "Surface bâtie (m²)",
    );
    expect(
      libelleCritere({ cle: "siteEnQpv", nom: "Quartier prioritaire de la ville (QPV)" }),
    ).toBe("Quartier prioritaire de la politique de la ville");
  });

  it("décrit une exclusion simple ou conditionnelle", () => {
    expect(descriptionExclusion({ usages: ["photovoltaique"], conditionsAssociees: [] })).toBe(
      "Usage incompatible",
    );
    expect(
      descriptionExclusion({
        usages: ["industrie"],
        conditionsAssociees: [{ critere: "presenceZoneHumide", reponse: "Oui" }],
      }),
    ).toBe("Usage incompatible si « Présence d'une zone humide : Oui »");
  });
});
