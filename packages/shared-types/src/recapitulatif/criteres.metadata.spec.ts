import { describe, expect, it } from "vitest";
import { CRITERES_METADATA, CRITERES_METADATA_LIST } from "./criteres.metadata";

describe("CRITERES_METADATA", () => {
  it("décrit les 27 critères de l'algorithme", () => {
    expect(Object.keys(CRITERES_METADATA)).toHaveLength(27);
  });

  it("a une clé cohérente avec l'identifiant de l'entrée", () => {
    for (const [key, meta] of Object.entries(CRITERES_METADATA)) {
      expect(meta.key).toBe(key);
    }
  });

  it("associe une source à chaque critère AUTOMATIQUE et aucune aux MANUELLE", () => {
    for (const meta of CRITERES_METADATA_LIST) {
      if (meta.saisie === "AUTOMATIQUE") {
        expect(meta.source).toBeDefined();
      } else {
        expect(meta.source).toBeUndefined();
      }
    }
  });

  it("compte 17 critères automatiques et 10 manuels", () => {
    const autos = CRITERES_METADATA_LIST.filter((c) => c.saisie === "AUTOMATIQUE");
    const manuels = CRITERES_METADATA_LIST.filter((c) => c.saisie === "MANUELLE");
    expect(autos).toHaveLength(17);
    expect(manuels).toHaveLength(10);
  });

  it("a des ordres uniques et contigus de 1 à 27", () => {
    const ordres = CRITERES_METADATA_LIST.map((c) => c.ordre);
    expect(new Set(ordres).size).toBe(27);
    expect(Math.min(...ordres)).toBe(1);
    expect(Math.max(...ordres)).toBe(27);
  });

  it("n'utilise que les trois sections attendues", () => {
    const sections = new Set(CRITERES_METADATA_LIST.map((c) => c.section));
    expect([...sections].sort()).toEqual(["environnement", "risques-zonages", "site-bati"]);
  });
});
