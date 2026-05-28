import { describe, it, expect } from "vitest";
import { POIDS_CRITERES } from "./algorithme.config";
import { NOMBRE_CRITERES_UTILISES } from "./algorithme.constants";

/**
 * Garde-fou de cohérence doc/algo.
 *
 * Si ce test casse après une modification de l'algorithme, c'est que la doc
 * (`docs/evaluation-mutabilite.md` et `.claude/context/evaluation-patterns.md`)
 * doit être mise à jour EN MÊME TEMPS (cf CLAUDE.md, section « Versionnage de
 * l'algorithme »). Mettre à jour les valeurs attendues ci-dessous ET la doc.
 */
describe("POIDS_CRITERES — cohérence avec la doc de l'algorithme", () => {
  // distanceIte (0.5) désactivé temporairement — en attente validation Cerema
  const NOMBRE_CRITERES_ATTENDU = 27;
  const POIDS_TOTAL_ATTENDU = 29.5;

  it(`comporte exactement ${NOMBRE_CRITERES_ATTENDU} critères`, () => {
    expect(NOMBRE_CRITERES_UTILISES).toBe(NOMBRE_CRITERES_ATTENDU);
    expect(Object.keys(POIDS_CRITERES)).toHaveLength(NOMBRE_CRITERES_ATTENDU);
  });

  it(`a un poids total de ${POIDS_TOTAL_ATTENDU}`, () => {
    const total = Object.values(POIDS_CRITERES).reduce((sum, poids) => sum + poids, 0);
    expect(total).toBe(POIDS_TOTAL_ATTENDU);
  });
});
