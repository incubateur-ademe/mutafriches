import { describe, it, expect } from "vitest";
import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  type DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { DONNEES_COMPLEMENTAIRES_COMPLETES } from "../evaluation/__test-helpers__/calculer-mutabilite.fixtures";
import {
  CLES_CRITERES_AUTOMATIQUES,
  DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS,
  cleSite,
  extraireCriteresSaisis,
  variantesParcelles,
} from "./attributaire.utils";

describe("cleSite", () => {
  it("donne la même clé quel que soit l'ordre des parcelles", () => {
    expect(cleSite(["77305000AP0454", "77305000AP0452"])).toBe(
      cleSite(["77305000AP0452", "77305000AP0454"]),
    );
  });

  it("normalise la section « 0X » et dédoublonne", () => {
    expect(cleSite(["491300000B0234", "49130000B0234"])).toBe("49130000B0234");
  });
});

describe("variantesParcelles", () => {
  it("ajoute la forme brute d'une section à une lettre", () => {
    expect(variantesParcelles(["491300000B0234"]).sort()).toEqual(
      ["49130000B0234", "491300000B0234"].sort(),
    );
  });

  it("ne duplique pas une section à deux lettres", () => {
    expect(variantesParcelles(["77305000AN0114"])).toEqual(["77305000AN0114"]);
  });
});

describe("extraireCriteresSaisis", () => {
  it("renvoie null sans saisie ou avec « ne sait pas » partout", () => {
    expect(extraireCriteresSaisis(undefined)).toBeNull();
    expect(extraireCriteresSaisis(DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS)).toBeNull();
  });

  it("garde les 9 champs requis d'une saisie réelle", () => {
    const saisis = extraireCriteresSaisis(DONNEES_COMPLEMENTAIRES_COMPLETES);
    expect(Object.keys(saisis ?? {}).sort()).toEqual([...CHAMPS_COMPLEMENTAIRES_REQUIS].sort());
    expect(saisis?.typeProprietaire).toBe(DONNEES_COMPLEMENTAIRES_COMPLETES.typeProprietaire);
  });

  it("complète par « ne sait pas » les champs absents des anciennes évaluations", () => {
    const ancienne = {
      ...DONNEES_COMPLEMENTAIRES_COMPLETES,
    } as Partial<DonneesComplementairesInputDto>;
    delete ancienne.presenceZoneHumide;
    expect(extraireCriteresSaisis(ancienne)?.presenceZoneHumide).toBe("ne-sait-pas");
  });
});

describe("CLES_CRITERES_AUTOMATIQUES", () => {
  it("couvre les critères enrichis, pas les critères saisis", () => {
    expect(CLES_CRITERES_AUTOMATIQUES).toContain("surfaceSite");
    expect(CLES_CRITERES_AUTOMATIQUES).toContain("siteEnZae");
    for (const champ of CHAMPS_COMPLEMENTAIRES_REQUIS) {
      expect(CLES_CRITERES_AUTOMATIQUES).not.toContain(champ);
    }
  });
});
