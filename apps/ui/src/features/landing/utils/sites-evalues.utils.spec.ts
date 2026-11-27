import { describe, it, expect } from "vitest";
import { arrondirAuPalier, formaterNombre } from "./sites-evalues.utils";

describe("arrondirAuPalier", () => {
  it.each([
    [4499, 500, 4000],
    [4500, 500, 4500],
    [4987, 500, 4500],
    [499, 500, 0],
    [0, 500, 0],
  ])("arrondit %i au palier de %i inférieur (%i)", (valeur, palier, attendu) => {
    expect(arrondirAuPalier(valeur, palier)).toBe(attendu);
  });

  it("retourne 0 pour une valeur négative ou un palier invalide", () => {
    expect(arrondirAuPalier(-10, 500)).toBe(0);
    expect(arrondirAuPalier(1200, 0)).toBe(0);
  });
});

describe("formaterNombre", () => {
  it("sépare les milliers à la française", () => {
    expect(formaterNombre(4500).replace(/\s/g, " ")).toBe("4 500");
  });
});
