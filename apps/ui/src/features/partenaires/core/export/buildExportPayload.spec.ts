import { describe, expect, it } from "vitest";
import {
  EtatBatiInfrastructure,
  TypeProprietaire,
  UsageType,
  type MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { buildExportPayload } from "./buildExportPayload";
import type { SaisieSite } from "../hooks/useSiteUserData";

const mutabilite: MutabiliteOutputDto = {
  fiabilite: {
    note: 8.5,
    text: "Fiable",
    description: "",
    criteresRenseignes: 28,
    criteresTotal: 30,
    poidsRenseignes: 29,
    poidsTotal: 32,
  },
  resultats: [
    { rang: 1, usage: UsageType.RENATURATION, indiceMutabilite: 72.4 },
    { rang: 2, usage: UsageType.RESIDENTIEL, indiceMutabilite: 61.2 },
  ],
};

const saisieQualifiee: SaisieSite = {
  idtup: "92025000BY0265",
  manualData: {
    typeProprietaire: TypeProprietaire.PUBLIC,
    etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
  },
  mutability: mutabilite,
};

const saisieVide: SaisieSite = {
  idtup: "92036000E0031",
  manualData: {},
  mutability: null,
};

const options = { format: "csv" as const, inclureMutabilite: false, versionAlgorithme: "1.13" };

describe("buildExportPayload", () => {
  it("ne transmet que les sites réellement qualifiés dans ce navigateur", () => {
    const payload = buildExportPayload([saisieQualifiee, saisieVide], options);

    expect(Object.keys(payload.connaissanceTerrain ?? {})).toEqual(["92025000BY0265"]);
  });

  it("convertit la saisie brute en données complémentaires typées", () => {
    const payload = buildExportPayload([saisieQualifiee], options);

    expect(payload.connaissanceTerrain?.["92025000BY0265"]).toMatchObject({
      typeProprietaire: TypeProprietaire.PUBLIC,
      etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    });
  });

  it("omet la clé quand aucun site n'est qualifié", () => {
    const payload = buildExportPayload([saisieVide], options);

    expect(payload.connaissanceTerrain).toBeUndefined();
  });

  it("n'envoie pas la mutabilité tant qu'elle n'est pas demandée", () => {
    const payload = buildExportPayload([saisieQualifiee], options);

    expect(payload.mutabilite).toBeUndefined();
    expect(payload.versionAlgorithme).toBeUndefined();
  });

  it("résume la mutabilité et joint la version d'algorithme quand elle est demandée", () => {
    const payload = buildExportPayload([saisieQualifiee, saisieVide], {
      ...options,
      inclureMutabilite: true,
    });

    expect(payload.mutabilite).toEqual({
      "92025000BY0265": {
        indices: { renaturation: 72.4, residentiel: 61.2 },
        usagePrioritaire: UsageType.RENATURATION,
        fiabilite: 8.5,
      },
    });
    expect(payload.versionAlgorithme).toBe("1.13");
  });

  it("n'envoie pas de détail de calcul : seul le résumé voyage", () => {
    const payload = buildExportPayload([saisieQualifiee], {
      ...options,
      inclureMutabilite: true,
    });

    expect(JSON.stringify(payload)).not.toContain("detailsCalcul");
  });
});
