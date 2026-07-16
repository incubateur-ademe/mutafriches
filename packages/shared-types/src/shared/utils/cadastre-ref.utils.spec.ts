import { describe, expect, it } from "vitest";
import { buildIduCandidate, parseNumParcelle } from "./cadastre-ref.utils";

describe("parseNumParcelle", () => {
  it("parse une parcelle unique", () => {
    expect(parseNumParcelle("AH13")).toEqual([{ section: "AH", numero: "13" }]);
  });

  it("hérite de la section pour les numéros suivants", () => {
    expect(parseNumParcelle("AB160/161/163")).toEqual([
      { section: "AB", numero: "160" },
      { section: "AB", numero: "161" },
      { section: "AB", numero: "163" },
    ]);
  });

  it("gère plusieurs sections dans le même champ", () => {
    expect(parseNumParcelle("AC578/ZB580")).toEqual([
      { section: "AC", numero: "578" },
      { section: "ZB", numero: "580" },
    ]);
  });

  it("gère une section à une seule lettre", () => {
    expect(parseNumParcelle("A3/4/5")).toEqual([
      { section: "A", numero: "3" },
      { section: "A", numero: "4" },
      { section: "A", numero: "5" },
    ]);
  });

  it("normalise la casse et les espaces", () => {
    expect(parseNumParcelle(" zi10 ")).toEqual([{ section: "ZI", numero: "10" }]);
  });

  it("ignore les segments illisibles", () => {
    expect(parseNumParcelle("AB12//xx/13")).toEqual([
      { section: "AB", numero: "12" },
      { section: "AB", numero: "13" },
    ]);
  });

  it("retourne un tableau vide pour une entrée vide", () => {
    expect(parseNumParcelle("")).toEqual([]);
  });
});

describe("buildIduCandidate", () => {
  it("construit un IDU avec section à 2 lettres", () => {
    expect(buildIduCandidate("77305", "AH", "13")).toBe("77305000AH0013");
  });

  it("pad la section à une lettre", () => {
    expect(buildIduCandidate("77061", "A", "3")).toBe("770610000A0003");
  });

  it("pad le numéro à 4 chiffres", () => {
    expect(buildIduCandidate("88011", "B", "22")).toBe("880110000B0022");
  });
});
