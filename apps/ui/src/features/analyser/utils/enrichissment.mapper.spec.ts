import { describe, it, expect } from "vitest";
import type { ZaerEnrichissement } from "@mutafriches/shared-types";
import { buildZaerBadges } from "./enrichissment.mapper";

const makeZaer = (overrides: Partial<ZaerEnrichissement> = {}): ZaerEnrichissement => ({
  enZoneZaer: true,
  nombreZones: 1,
  filieres: [],
  zones: [],
  ...overrides,
});

describe("buildZaerBadges", () => {
  it("retourne ['Non'] si zaer absent", () => {
    expect(buildZaerBadges(undefined)).toEqual(["Non"]);
  });

  it("retourne ['Non'] si enZoneZaer=false", () => {
    expect(buildZaerBadges(makeZaer({ enZoneZaer: false }))).toEqual(["Non"]);
  });

  it("retourne ['Non'] si aucune zone", () => {
    expect(buildZaerBadges(makeZaer({ enZoneZaer: true, zones: [] }))).toEqual(["Non"]);
  });

  it("retourne 'Oui' (générique) pour une zone SOLAIRE_PV toit", () => {
    const zaer = makeZaer({
      filieres: ["SOLAIRE_PV"],
      zones: [{ nom: "Zone toit", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" }],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui"]);
  });

  it("retourne 'Oui' (générique) pour une zone SOLAIRE_PV sol (non-ombrière)", () => {
    const zaer = makeZaer({
      filieres: ["SOLAIRE_PV"],
      zones: [
        {
          nom: "Parc photovoltaïque - Ychoux",
          filiere: "SOLAIRE_PV",
          detailFiliere: "SOLAIRE_PV_RNV_SOL",
        },
      ],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui"]);
  });

  it("retourne 'Oui Solaire photovoltaïque' pour une zone SOLAIRE_PV ombrière", () => {
    const zaer = makeZaer({
      filieres: ["SOLAIRE_PV"],
      zones: [
        {
          nom: "Zone ombrière",
          filiere: "SOLAIRE_PV",
          detailFiliere: "SOLAIRE_PV_NV_OMBRIERE",
        },
      ],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui Solaire photovoltaïque"]);
  });

  it("pour SOLAIRE_PV : ombrière prime sur toit/sol (un seul badge ombrière)", () => {
    const zaer = makeZaer({
      filieres: ["SOLAIRE_PV"],
      zones: [
        { nom: "Toit", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" },
        { nom: "Ombrière", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_OMBRIERE" },
        { nom: "Sol", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_RNV_SOL" },
      ],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui Solaire photovoltaïque"]);
  });

  it("retourne 'Oui Eolien' pour une zone EOLIEN", () => {
    const zaer = makeZaer({
      filieres: ["EOLIEN"],
      zones: [{ nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null }],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui Eolien"]);
  });

  it("mappe les filières non-PV vers leurs libellés spec", () => {
    const cases: Array<[string, string]> = [
      ["SOLAIRE_THERMIQUE", "Oui Solaire thermique"],
      ["EOLIEN", "Oui Eolien"],
      ["HYDROELECTRICITE", "Oui Hydroélectricité"],
      ["BIOGAZ", "Oui Biométhane"],
      ["BIOMETHANE", "Oui Biométhane"],
      ["BIOMASSE", "Oui Biomasse"],
      ["GEOTHERMIE", "Oui Géothermie"],
      ["AEROTHERMIE", "Oui Aérothermie"],
      ["THALASSOTHERMIE", "Oui Thalassothermie"],
    ];

    for (const [filiere, libelle] of cases) {
      const zaer = makeZaer({
        filieres: [filiere],
        zones: [{ nom: null, filiere, detailFiliere: null }],
      });
      expect(buildZaerBadges(zaer), `filière ${filiere}`).toEqual([libelle]);
    }
  });

  it("cumule les badges pour plusieurs filières (dédupliqué, ordre d'apparition)", () => {
    const zaer = makeZaer({
      filieres: ["SOLAIRE_PV", "EOLIEN", "BIOMASSE"],
      zones: [
        { nom: "PV toit", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" },
        { nom: "Eolien", filiere: "EOLIEN", detailFiliere: null },
        { nom: "Biomasse", filiere: "BIOMASSE", detailFiliere: null },
      ],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui", "Oui Eolien", "Oui Biomasse"]);
  });

  it("cumule PV ombrière + autre filière", () => {
    const zaer = makeZaer({
      filieres: ["SOLAIRE_PV", "EOLIEN"],
      zones: [
        { nom: "Ombrière", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_OMBRIERE" },
        { nom: "Eolien", filiere: "EOLIEN", detailFiliere: null },
      ],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui Solaire photovoltaïque", "Oui Eolien"]);
  });

  it("fallback 'Oui' pour une filière inconnue", () => {
    const zaer = makeZaer({
      filieres: ["FILIERE_INCONNUE"],
      zones: [{ nom: null, filiere: "FILIERE_INCONNUE", detailFiliere: null }],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui"]);
  });

  it("dédoublonne plusieurs zones de même filière non-PV", () => {
    const zaer = makeZaer({
      filieres: ["EOLIEN"],
      zones: [
        { nom: "Zone éolien 1", filiere: "EOLIEN", detailFiliere: null },
        { nom: "Zone éolien 2", filiere: "EOLIEN", detailFiliere: null },
      ],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui Eolien"]);
  });

  it("est insensible à la casse des filières", () => {
    const zaer = makeZaer({
      filieres: ["eolien"],
      zones: [{ nom: null, filiere: "eolien", detailFiliere: null }],
    });
    expect(buildZaerBadges(zaer)).toEqual(["Oui Eolien"]);
  });
});
