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
});
