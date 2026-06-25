import { describe, it, expect } from "vitest";
import {
  deriverRaccordementEau,
  SEUIL_BATI_RACCORDEMENT_EAU_M2,
} from "./raccordement-eau.derivation";
import { RaccordementEau } from "../enums";

describe("deriverRaccordementEau", () => {
  it("retourne OUI pour une surface bâtie strictement supérieure au seuil", () => {
    expect(deriverRaccordementEau(21)).toBe(RaccordementEau.OUI);
    expect(deriverRaccordementEau(6600)).toBe(RaccordementEau.OUI);
  });

  it("retourne NON pour une surface bâtie égale au seuil", () => {
    expect(deriverRaccordementEau(SEUIL_BATI_RACCORDEMENT_EAU_M2)).toBe(RaccordementEau.NON);
  });

  it("retourne NON pour un terrain nu (surface bâtie à 0)", () => {
    expect(deriverRaccordementEau(0)).toBe(RaccordementEau.NON);
  });

  it("retourne NE_SAIT_PAS quand la surface bâtie est indisponible (BDNB en panne)", () => {
    expect(deriverRaccordementEau(undefined)).toBe(RaccordementEau.NE_SAIT_PAS);
  });
});
