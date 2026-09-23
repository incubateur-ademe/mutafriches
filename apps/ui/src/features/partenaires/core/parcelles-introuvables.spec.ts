import { describe, expect, it } from "vitest";
import { parcellesIntrouvables } from "./parcelles-introuvables";

describe("parcellesIntrouvables", () => {
  const site = ["920360000J0440", "920360000J0001", "920360000L0162"];

  it("liste les parcelles absentes du résultat d'enrichissement", () => {
    expect(parcellesIntrouvables(site, ["92036000L0162"])).toEqual([
      "920360000J0440",
      "920360000J0001",
    ]);
  });

  it("compare sur la forme normalisée (section 0X vs X)", () => {
    expect(
      parcellesIntrouvables(site, ["92036000J0440", "92036000J0001", "92036000L0162"]),
    ).toEqual([]);
  });

  it("ne signale rien sans identifiants enrichis", () => {
    expect(parcellesIntrouvables(site, undefined)).toEqual([]);
  });
});
