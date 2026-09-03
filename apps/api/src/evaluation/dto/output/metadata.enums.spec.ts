import { describe, expect, it } from "vitest";
import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  CRITERES_METADATA,
  listerChampsComplementairesManquants,
} from "@mutafriches/shared-types";
import { METADATA_CHAMPS_DERIVES, METADATA_CHAMPS_REQUIS, METADATA_ENUMS } from "./metadata.enums";
import { DONNEES_COMPLEMENTAIRES_COMPLETES } from "../../__test-helpers__/calculer-mutabilite.fixtures";

/**
 * GET /evaluation/metadata est l'endpoint depuis lequel un intégrateur construit son
 * formulaire. Une dérive entre ce qu'il annonce et ce que POST /evaluation/calculer exige
 * fabrique des intégrations cassées : ces tests ferment cette porte.
 */
describe("METADATA_ENUMS", () => {
  it("annonce exactement les champs complémentaires requis par le calcul", () => {
    expect(METADATA_CHAMPS_REQUIS).toEqual([...CHAMPS_COMPLEMENTAIRES_REQUIS]);
  });

  it("documente les valeurs de chaque champ requis dans enums.saisie", () => {
    for (const champ of CHAMPS_COMPLEMENTAIRES_REQUIS) {
      expect(METADATA_ENUMS.saisie[champ]).toBeDefined();
      expect(METADATA_ENUMS.saisie[champ].length).toBeGreaterThan(0);
    }
  });

  it("couvre tous les critères manuels du référentiel partagé", () => {
    const criteresManuels = Object.values(CRITERES_METADATA)
      .filter((critere) => critere.saisie === "MANUELLE")
      .map((critere) => critere.key)
      .sort();

    expect(Object.keys(METADATA_ENUMS.saisie).sort()).toEqual(criteresManuels);
  });

  it("classe les champs dérivés hors des champs requis", () => {
    for (const champ of METADATA_CHAMPS_DERIVES) {
      expect(METADATA_CHAMPS_REQUIS).not.toContain(champ);
      // Conservé dans saisie le temps d'une dépréciation annoncée
      expect(METADATA_ENUMS.saisie[champ]).toBeDefined();
    }
  });

  it("propose des valeurs qui composent un payload accepté par le calcul", () => {
    const payload = Object.fromEntries(
      METADATA_CHAMPS_REQUIS.map((champ) => [champ, METADATA_ENUMS.saisie[champ][0]]),
    );

    expect(listerChampsComplementairesManquants(payload)).toEqual([]);
  });

  it("accepte les valeurs effectivement envoyées par l'UI", () => {
    for (const [champ, valeur] of Object.entries(DONNEES_COMPLEMENTAIRES_COMPLETES)) {
      expect(METADATA_ENUMS.saisie[champ]).toContain(valeur);
    }
  });
});
