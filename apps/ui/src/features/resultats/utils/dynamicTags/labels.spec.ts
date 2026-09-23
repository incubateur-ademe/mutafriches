import { describe, expect, it } from "vitest";
import { SEUIL_DISTANCE_RESEAU_CHALEUR } from "./constants";
import { getCritereTagLabel } from "./labels";

/**
 * `getCritereTagLabel` alimente les tags du podium et du PDF à partir des critères
 * d'avantage renvoyés par l'algorithme. Son `default` retourne la clé brute du critère :
 * un critère sans `case` s'affiche donc tel quel sur la carte de l'usage.
 */
describe("getCritereTagLabel", () => {
  describe("distanceReseauChaleur", () => {
    it("retourne le tag sous le seuil de proximité", () => {
      expect(getCritereTagLabel("distanceReseauChaleur", 320)).toBe("réseau de chaleur");
    });

    // Seuil strict, aligné sur la matrice (`value < 500`) : à 500 m pile, pas de tag.
    it.each([
      [SEUIL_DISTANCE_RESEAU_CHALEUR - 1, "réseau de chaleur"],
      [SEUIL_DISTANCE_RESEAU_CHALEUR, null],
      [SEUIL_DISTANCE_RESEAU_CHALEUR + 1, null],
    ])("%d m → %s", (metres, attendu) => {
      expect(getCritereTagLabel("distanceReseauChaleur", metres)).toBe(attendu);
    });

    it("ne produit aucun tag quand la donnée est absente", () => {
      expect(getCritereTagLabel("distanceReseauChaleur", null)).toBeNull();
      expect(getCritereTagLabel("distanceReseauChaleur", undefined)).toBeNull();
    });
  });

  describe("siteEnQpv", () => {
    it("retourne le tag quand le site est en quartier prioritaire", () => {
      expect(getCritereTagLabel("siteEnQpv", true)).toBe("QPV");
    });

    // Hors QPV le critère est neutre sur les sept usages : il n'entre jamais dans les
    // avantages du podium, et un tag "QPV" y serait trompeur.
    it("ne produit aucun tag hors quartier prioritaire ni sans donnée", () => {
      expect(getCritereTagLabel("siteEnQpv", false)).toBeNull();
      expect(getCritereTagLabel("siteEnQpv", undefined)).toBeNull();
    });
  });

  describe("saturationReseauEnr", () => {
    it("ne produit jamais de tag, le critère n'étant jamais un avantage", () => {
      expect(getCritereTagLabel("saturationReseauEnr", true)).toBeNull();
      expect(getCritereTagLabel("saturationReseauEnr", false)).toBeNull();
    });
  });

  // Garde-fou générique : sans `case`, le podium afficherait la clé technique du critère.
  it("retourne la clé brute pour un critère sans libellé dédié", () => {
    expect(getCritereTagLabel("critereInconnu", 42)).toBe("critereInconnu");
  });
});
