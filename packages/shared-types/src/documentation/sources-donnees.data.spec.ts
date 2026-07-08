import { describe, expect, it } from "vitest";
import { CRITERES_METADATA_LIST } from "../recapitulatif/criteres.metadata";
import { SOURCES_DONNEES, getCriteresManuels, getCriteresPourSource } from "./sources-donnees.data";

describe("SOURCES_DONNEES", () => {
  it("a des identifiants uniques", () => {
    const ids = SOURCES_DONNEES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("déclare au moins une source d'enrichissement par bloc", () => {
    for (const source of SOURCES_DONNEES) {
      expect(source.sourcesEnrichissement.length).toBeGreaterThan(0);
    }
  });

  it("couvre exactement tous les critères enrichis automatiquement, sans doublon", () => {
    const criteresAutomatiques = CRITERES_METADATA_LIST.filter(
      (c) => c.saisie === "AUTOMATIQUE",
    ).map((c) => c.key);

    const criteresCouverts = SOURCES_DONNEES.flatMap((source) =>
      getCriteresPourSource(source).map((c) => c.key),
    );

    // Aucun critère enrichi couvert deux fois par deux blocs distincts
    expect(new Set(criteresCouverts).size).toBe(criteresCouverts.length);
    // Tous les critères enrichis sont documentés
    expect(new Set(criteresCouverts)).toEqual(new Set(criteresAutomatiques));
  });

  it("expose les 10 critères saisis manuellement", () => {
    const manuels = getCriteresManuels();
    expect(manuels).toHaveLength(10);
    expect(manuels.every((c) => c.saisie === "MANUELLE")).toBe(true);
  });

  it("représente le poids total de l'algorithme (29.5)", () => {
    const poidsTotal = CRITERES_METADATA_LIST.reduce((somme, c) => somme + c.poids, 0);
    expect(poidsTotal).toBe(29.5);
  });
});
