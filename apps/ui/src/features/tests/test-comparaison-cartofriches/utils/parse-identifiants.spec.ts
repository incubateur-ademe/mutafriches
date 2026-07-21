import { describe, expect, it } from "vitest";
import { parseIdentifiantsColles } from "./parse-identifiants";

describe("parseIdentifiantsColles", () => {
  it("découpe sur les retours ligne", () => {
    expect(parseIdentifiantsColles("49353000AC0628\n49353000AV1255")).toEqual([
      ["49353000AC0628"],
      ["49353000AV1255"],
    ]);
  });

  it("découpe sur virgules, espaces et points-virgules", () => {
    expect(parseIdentifiantsColles("49353000AC0628, 49353000AV1255; 49353000AV1256")).toEqual([
      ["49353000AC0628"],
      ["49353000AV1255"],
      ["49353000AV1256"],
    ]);
  });

  it("met en majuscules et ignore les jetons vides", () => {
    expect(parseIdentifiantsColles("  49353000ac0628 \n\n ")).toEqual([["49353000AC0628"]]);
  });

  it("retourne une liste vide pour un texte vide", () => {
    expect(parseIdentifiantsColles("   ")).toEqual([]);
  });
});
