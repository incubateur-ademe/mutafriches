import { describe, expect, it } from "vitest";
import {
  buildIduCandidate,
  parseNumParcelle,
  prefixeDeIdu,
  segmentsIllisibles,
} from "./cadastre-ref.utils";

describe("parseNumParcelle", () => {
  it("parse une parcelle unique", () => {
    expect(parseNumParcelle("AH13")).toEqual([{ prefixe: "000", section: "AH", numero: "13" }]);
  });

  it("hérite de la section pour les numéros suivants", () => {
    expect(parseNumParcelle("AB160/161/163")).toEqual([
      { prefixe: "000", section: "AB", numero: "160" },
      { prefixe: "000", section: "AB", numero: "161" },
      { prefixe: "000", section: "AB", numero: "163" },
    ]);
  });

  it("gère plusieurs sections dans le même champ", () => {
    expect(parseNumParcelle("AC578/ZB580")).toEqual([
      { prefixe: "000", section: "AC", numero: "578" },
      { prefixe: "000", section: "ZB", numero: "580" },
    ]);
  });

  it("gère une section à une seule lettre", () => {
    expect(parseNumParcelle("A3/4/5")).toEqual([
      { prefixe: "000", section: "A", numero: "3" },
      { prefixe: "000", section: "A", numero: "4" },
      { prefixe: "000", section: "A", numero: "5" },
    ]);
  });

  it("normalise la casse et les espaces", () => {
    expect(parseNumParcelle(" zi10 ")).toEqual([{ prefixe: "000", section: "ZI", numero: "10" }]);
  });

  it("ignore les segments illisibles", () => {
    expect(parseNumParcelle("AB12//xx/13")).toEqual([
      { prefixe: "000", section: "AB", numero: "12" },
      { prefixe: "000", section: "AB", numero: "13" },
    ]);
  });

  it("retourne un tableau vide pour une entrée vide", () => {
    expect(parseNumParcelle("")).toEqual([]);
  });

  // Commune nouvelle : le préfixe COM_ABS de la commune absorbée précède la section
  // (inventaire EODD, Bray-Saint-Aignan).
  it("gère un préfixe COM_ABS de commune absorbée", () => {
    expect(parseNumParcelle("267B18/ 267B21/ 267B316")).toEqual([
      { prefixe: "267", section: "B", numero: "18" },
      { prefixe: "267", section: "B", numero: "21" },
      { prefixe: "267", section: "B", numero: "316" },
    ]);
  });

  it("hérite du préfixe COM_ABS pour les numéros seuls suivants", () => {
    expect(parseNumParcelle("267B18/21")).toEqual([
      { prefixe: "267", section: "B", numero: "18" },
      { prefixe: "267", section: "B", numero: "21" },
    ]);
  });

  it("repasse au préfixe par défaut après une section sans préfixe", () => {
    expect(parseNumParcelle("267B18/AC12")).toEqual([
      { prefixe: "267", section: "B", numero: "18" },
      { prefixe: "000", section: "AC", numero: "12" },
    ]);
  });

  // Section écrite déjà paddée à 2 caractères (inventaire EODD, Béville-le-Comte).
  it("gère une section paddée d'un zéro", () => {
    expect(parseNumParcelle("0F1444 /0F1445")).toEqual([
      { prefixe: "000", section: "F", numero: "1444" },
      { prefixe: "000", section: "F", numero: "1445" },
    ]);
  });

  it("ne confond pas une section paddée avec un préfixe COM_ABS", () => {
    expect(parseNumParcelle("0F1444")[0].prefixe).toBe("000");
    expect(parseNumParcelle("000B18")[0].prefixe).toBe("000");
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

  it("intègre le préfixe COM_ABS fourni", () => {
    expect(buildIduCandidate("45053", "B", "18", "267")).toBe("450532670B0018");
  });
});

describe("prefixeDeIdu", () => {
  it("extrait le préfixe d'un IDU à 14 caractères", () => {
    expect(prefixeDeIdu("450532670B0018")).toBe("267");
    expect(prefixeDeIdu("77305000AH0013")).toBe("000");
  });

  // L'API Carto renvoie parfois la section non paddée (13 caractères).
  it("extrait le préfixe d'un IDU à 13 caractères", () => {
    expect(prefixeDeIdu("29151000C2489")).toBe("000");
  });

  it("retourne null hors des longueurs attendues", () => {
    expect(prefixeDeIdu("77305000AH13")).toBeNull();
    expect(prefixeDeIdu(undefined)).toBeNull();
  });
});

describe("segmentsIllisibles", () => {
  it("liste les segments qu'aucune forme ne reconnaît", () => {
    expect(segmentsIllisibles("AB12//xx/13")).toEqual(["XX"]);
  });

  it("ne signale rien quand tout est reconnu", () => {
    expect(segmentsIllisibles("267B18/ 0F1444/ AH13/ 14")).toEqual([]);
    expect(segmentsIllisibles("")).toEqual([]);
  });

  // Le complément exact de parseNumParcelle : tout segment non vide est soit parsé, soit listé.
  it("complète parseNumParcelle sans recouvrement", () => {
    const champ = "AB12/ zz / 13 / 0F9/ ???";
    const nonVides = champ.split("/").filter((s) => s.trim().length > 0).length;
    expect(parseNumParcelle(champ).length + segmentsIllisibles(champ).length).toBe(nonVides);
  });
});
