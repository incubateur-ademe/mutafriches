import { describe, expect, it } from "vitest";
import { CRITERES_METADATA, CRITERES_METADATA_LIST } from "../recapitulatif/criteres.metadata";
import { DEFINITIONS_CRITERES } from "./criteres-definitions.data";
import { MATRICE_SCORING_DOC } from "./matrice-scoring.data";
import { getSourceCritere } from "./sources-criteres.data";

describe("Données de la page « Comprendre les analyses »", () => {
  const cles = Object.keys(CRITERES_METADATA).sort();

  it("définit chaque critère, et seulement eux", () => {
    expect(Object.keys(DEFINITIONS_CRITERES).sort()).toEqual(cles);
  });

  it("documente la matrice de chaque critère, avec le même poids", () => {
    expect(MATRICE_SCORING_DOC.map((c) => c.cle).sort()).toEqual(cles);
    for (const critere of MATRICE_SCORING_DOC) {
      expect(critere.poids).toBe(CRITERES_METADATA[critere.cle].poids);
      expect(critere.lignes.length).toBeGreaterThan(0);
    }
  });

  it("rattache chaque critère automatique à une source documentée", () => {
    for (const critere of CRITERES_METADATA_LIST) {
      const source = getSourceCritere(critere);
      if (critere.saisie === "AUTOMATIQUE") {
        expect(source, critere.key).toBeDefined();
        expect(source?.urlDoc).toMatch(/^https:\/\//);
      } else {
        expect(source).toBeUndefined();
      }
    }
  });
});
