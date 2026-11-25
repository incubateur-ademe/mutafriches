import { describe, expect, it } from "vitest";
import { CRITERES_METADATA, CRITERES_METADATA_LIST } from "../recapitulatif/criteres.metadata";
import { DEFINITIONS_CRITERES } from "./criteres-definitions.data";
import { MATRICE_SCORING_DOC } from "./matrice-scoring.data";
import {
  CRITERES_PRE_REMPLIS,
  getSourceCritere,
  getSourcesPreRemplissage,
  SOURCES_HORS_CALCUL,
} from "./sources-criteres.data";
import { SOURCES_DONNEES } from "./sources-donnees.data";

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

  it("ne pré-remplit que des critères saisis, depuis des sources documentées", () => {
    expect(CRITERES_PRE_REMPLIS).toContain("presencePollution");
    for (const cle of CRITERES_PRE_REMPLIS) {
      expect(CRITERES_METADATA[cle]?.saisie, cle).toBe("MANUELLE");
      const sources = getSourcesPreRemplissage(cle);
      expect(sources.length, cle).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.urlDoc, source.nom).toMatch(/^https:\/\//);
      }
    }
    expect(getSourcesPreRemplissage("surfaceSite")).toEqual([]);
  });

  it("affiche chaque source documentée : par un critère, ou parmi les données hors calcul", () => {
    const sourcesDesCriteres = new Set(CRITERES_METADATA_LIST.map((c) => c.source));
    const blocsSansCritere = SOURCES_DONNEES.filter(
      (bloc) => !bloc.sourcesEnrichissement.some((s) => sourcesDesCriteres.has(s)),
    ).map((bloc) => bloc.id);

    expect(SOURCES_HORS_CALCUL.flatMap((s) => s.blocId ?? []).sort()).toEqual(
      blocsSansCritere.sort(),
    );
    for (const source of SOURCES_HORS_CALCUL) {
      expect(source.urlDoc, source.cle).toMatch(/^https:\/\//);
      expect(Object.keys(CRITERES_METADATA)).not.toContain(source.cle);
    }
  });
});
