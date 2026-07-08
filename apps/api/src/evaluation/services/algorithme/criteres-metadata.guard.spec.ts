import { CRITERES_METADATA } from "@mutafriches/shared-types";
import { POIDS_CRITERES } from "./algorithme.config";

/**
 * Garde-fou : le registre partagé des critères (shared-types) doit décrire
 * exactement les mêmes critères que POIDS_CRITERES (source de vérité algorithme).
 * Toute divergence (ajout/retrait de critère) casse ce test.
 */
describe("Alignement CRITERES_METADATA <-> POIDS_CRITERES", () => {
  it("décrit exactement les mêmes critères que POIDS_CRITERES", () => {
    const clesPoids = Object.keys(POIDS_CRITERES).sort();
    const clesMetadata = Object.keys(CRITERES_METADATA).sort();
    expect(clesMetadata).toEqual(clesPoids);
  });

  it("expose le même poids que POIDS_CRITERES pour chaque critère", () => {
    for (const [key, poids] of Object.entries(POIDS_CRITERES)) {
      expect(CRITERES_METADATA[key].poids).toBe(poids);
    }
  });
});
