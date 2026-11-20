import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  construireFrameAncestors,
  construireOriginesCors,
  estOrigineCorsAutorisee,
  estOrigineCorsDeclaree,
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

  it("ajoute les origines de ALLOWED_ORIGINS, normalisées", () => {
    const origines = construireOriginesCors({ allowed: "https://a.fr/, HTTPS://C.fr:443 " });
    expect(origines).toContain("https://a.fr");
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

describe("estOrigineCorsDeclaree", () => {
  const autorisees = ["https://stats.incubateur.ademe.fr"];
  let nodeEnvInitial: string | undefined;

  beforeEach(() => {
    nodeEnvInitial = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    process.env.NODE_ENV = nodeEnvInitial;
  });

  it("n'interroge pas le registre pour une requête sans Origin ou une origine fixe", async () => {
    const estDeclaree = vi.fn().mockResolvedValue(false);

    await expect(estOrigineCorsDeclaree(undefined, autorisees, estDeclaree)).resolves.toBe(true);
    await expect(estOrigineCorsDeclaree(autorisees[0], autorisees, estDeclaree)).resolves.toBe(
      true,
    );
    expect(estDeclaree).not.toHaveBeenCalled();
  });

  it("accepte une origine déclarée dans le registre, normalisée", async () => {
    const estDeclaree = vi.fn().mockResolvedValue(true);

    await expect(
      estOrigineCorsDeclaree("https://Partenaire.fr/", autorisees, estDeclaree),
    ).resolves.toBe(true);
    expect(estDeclaree).toHaveBeenCalledWith("https://partenaire.fr");
  });

  it("refuse une origine inconnue, ou si le registre échoue", async () => {
    await expect(
      estOrigineCorsDeclaree("https://attaquant.fr", autorisees, () => Promise.resolve(false)),
    ).resolves.toBe(false);
    await expect(
      estOrigineCorsDeclaree("https://attaquant.fr", autorisees, () =>
        Promise.reject(new Error("base absente")),
      ),
    ).resolves.toBe(false);
  });
});

describe("construireFrameAncestors", () => {
  it("autorise notre propre origine, les intégrateurs iframe et les origines fixes", () => {
    const sources = construireFrameAncestors({ allowed: "https://interne.fr" });
    expect(sources[0]).toBe("'self'");
    expect(sources).toContain("benefriches.ademe.fr");
    expect(sources).toContain("monespacecollectivite.anct.gouv.fr");
    expect(sources).toContain("https://interne.fr");
    expect(new Set(sources).size).toBe(sources.length);
  });
});
