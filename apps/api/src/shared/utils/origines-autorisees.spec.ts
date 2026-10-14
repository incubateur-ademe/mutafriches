import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  construireOriginesCors,
  estOrigineCorsAutorisee,
  ORIGINES_DASHBOARDS_ADEME,
  ORIGINES_MUTAFRICHES,
} from "./origines-autorisees";

describe("construireOriginesCors", () => {
  it("contient toujours nos origines et celles des dashboards ADEME", () => {
    const origines = construireOriginesCors({});
    for (const origine of [...ORIGINES_MUTAFRICHES, ...ORIGINES_DASHBOARDS_ADEME]) {
      expect(origines).toContain(origine);
    }
  });

  it("ajoute les origines des deux variables d'environnement, normalisées", () => {
    const origines = construireOriginesCors({
      allowed: "https://a.fr/",
      allowedIntegrators: " https://b.fr , HTTPS://C.fr:443 ",
    });
    expect(origines).toContain("https://a.fr");
    expect(origines).toContain("https://b.fr");
    expect(origines).toContain("https://c.fr");
  });

  it("ne contient pas de doublon", () => {
    const origines = construireOriginesCors({ allowed: ORIGINES_MUTAFRICHES[0] });
    expect(new Set(origines).size).toBe(origines.length);
  });
});

describe("estOrigineCorsAutorisee", () => {
  const autorisees = ["https://partenaire.fr"];
  let nodeEnvInitial: string | undefined;

  beforeEach(() => {
    nodeEnvInitial = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = nodeEnvInitial;
  });

  it("laisse passer une requête sans Origin", () => {
    expect(estOrigineCorsAutorisee(undefined, autorisees)).toBe(true);
  });

  it("accepte une origine de la liste et refuse les autres", () => {
    process.env.NODE_ENV = "production";
    expect(estOrigineCorsAutorisee("https://partenaire.fr", autorisees)).toBe(true);
    expect(estOrigineCorsAutorisee("https://attaquant.fr", autorisees)).toBe(false);
    expect(estOrigineCorsAutorisee("https://partenaire.fr.attaquant.fr", autorisees)).toBe(false);
  });

  it("refuse localhost hors développement", () => {
    process.env.NODE_ENV = "production";
    expect(estOrigineCorsAutorisee("http://localhost:5173", autorisees)).toBe(false);
  });

  it("accepte toute origine locale en développement", () => {
    process.env.NODE_ENV = "development";
    expect(estOrigineCorsAutorisee("http://localhost:5174", autorisees)).toBe(true);
    expect(estOrigineCorsAutorisee("http://127.0.0.1:3000", autorisees)).toBe(true);
    expect(estOrigineCorsAutorisee("https://attaquant.fr", autorisees)).toBe(false);
  });
});
