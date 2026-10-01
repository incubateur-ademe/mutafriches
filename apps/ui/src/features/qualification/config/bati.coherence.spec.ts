import { describe, it, expect } from "vitest";
import { EtatBatiInfrastructure, ValeurArchitecturale } from "@mutafriches/shared-types";
import { champBatiMasque, normaliserBati } from "./bati.coherence";

describe("champBatiMasque", () => {
  it("masque l'état du bâti si la valeur patrimoniale vaut « Pas de bâti »", () => {
    expect(
      champBatiMasque({
        valeurArchitecturaleHistorique: ValeurArchitecturale.PAS_DE_BATI,
        etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
      }),
    ).toBe("etatBatiInfrastructure");
  });

  it("masque la valeur patrimoniale si l'état du bâti vaut « Pas de bâti »", () => {
    expect(
      champBatiMasque({
        valeurArchitecturaleHistorique: "",
        etatBatiInfrastructure: EtatBatiInfrastructure.PAS_DE_BATI,
      }),
    ).toBe("valeurArchitecturaleHistorique");
  });

  it("garde la valeur patrimoniale visible quand les deux valent « Pas de bâti »", () => {
    expect(
      champBatiMasque({
        valeurArchitecturaleHistorique: ValeurArchitecturale.PAS_DE_BATI,
        etatBatiInfrastructure: EtatBatiInfrastructure.PAS_DE_BATI,
      }),
    ).toBe("etatBatiInfrastructure");
  });

  it("ne masque rien sans « Pas de bâti »", () => {
    expect(champBatiMasque({})).toBeNull();
    expect(
      champBatiMasque({
        valeurArchitecturaleHistorique: ValeurArchitecturale.ORDINAIRE,
        etatBatiInfrastructure: EtatBatiInfrastructure.NE_SAIT_PAS,
      }),
    ).toBeNull();
  });
});

describe("normaliserBati", () => {
  it("aligne le champ masqué sur « Pas de bâti » sans toucher aux autres champs", () => {
    expect(
      normaliserBati({
        typeProprietaire: "public",
        valeurArchitecturaleHistorique: ValeurArchitecturale.SANS_INTERET,
        etatBatiInfrastructure: EtatBatiInfrastructure.PAS_DE_BATI,
      }),
    ).toEqual({
      typeProprietaire: "public",
      valeurArchitecturaleHistorique: ValeurArchitecturale.PAS_DE_BATI,
      etatBatiInfrastructure: EtatBatiInfrastructure.PAS_DE_BATI,
    });
  });

  it("corrige une combinaison incohérente déjà enregistrée", () => {
    expect(
      normaliserBati({
        valeurArchitecturaleHistorique: ValeurArchitecturale.PAS_DE_BATI,
        etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
      }).etatBatiInfrastructure,
    ).toBe(EtatBatiInfrastructure.PAS_DE_BATI);
  });

  it("laisse les valeurs inchangées sans « Pas de bâti »", () => {
    const values = {
      valeurArchitecturaleHistorique: ValeurArchitecturale.ORDINAIRE,
      etatBatiInfrastructure: "",
    };
    expect(normaliserBati(values)).toBe(values);
  });
});
