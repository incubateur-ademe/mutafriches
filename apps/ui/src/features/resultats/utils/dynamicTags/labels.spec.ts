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

  // Garde-fou générique : sans `case`, le podium afficherait la clé technique du critère.
  it("retourne la clé brute pour un critère sans libellé dédié", () => {
    expect(getCritereTagLabel("critereInconnu", 42)).toBe("critereInconnu");
  });
});
