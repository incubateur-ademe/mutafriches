import { describe, it, expect } from "vitest";
import { EtatBatiInfrastructure } from "@mutafriches/shared-types";
import { MATRICE_SCORING, POIDS_CRITERES } from "./algorithme.config";
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

describe("MATRICE_SCORING — État du bâti", () => {
  // "Bâti faiblement dégradé" doit rester scoring-neutre vis-à-vis de "Bâti intact" (cf. ADR-0025)
  it("DEGRADATION_FAIBLE a des scores identiques à DEGRADATION_INEXISTANTE", () => {
    const etatBati = MATRICE_SCORING.etatBatiInfrastructure;
    expect(etatBati[EtatBatiInfrastructure.DEGRADATION_FAIBLE]).toEqual(
      etatBati[EtatBatiInfrastructure.DEGRADATION_INEXISTANTE],
    );
  });
});
