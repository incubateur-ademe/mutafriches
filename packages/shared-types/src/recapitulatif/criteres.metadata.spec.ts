import { describe, expect, it } from "vitest";
import {
  CRITERES_METADATA,
  CRITERES_METADATA_LIST,
  CRITERES_STATS,
  POIDS_TOTAL_AFFICHE,
} from "./criteres.metadata";

describe("CRITERES_METADATA", () => {
  it("décrit les 31 critères de l'algorithme", () => {
    expect(Object.keys(CRITERES_METADATA)).toHaveLength(31);
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

  it("compte 21 critères automatiques et 10 manuels", () => {
    const autos = CRITERES_METADATA_LIST.filter((c) => c.saisie === "AUTOMATIQUE");
    const manuels = CRITERES_METADATA_LIST.filter((c) => c.saisie === "MANUELLE");
    expect(autos).toHaveLength(21);
    expect(manuels).toHaveLength(10);
  });

  it("a des ordres uniques et contigus de 1 à 31", () => {
    const ordres = CRITERES_METADATA_LIST.map((c) => c.ordre);
    expect(new Set(ordres).size).toBe(31);
    expect(Math.min(...ordres)).toBe(1);
    expect(Math.max(...ordres)).toBe(31);
  });

  it("dérive des compteurs de documentation alignés sur le registre", () => {
    expect(CRITERES_STATS.total).toBe(CRITERES_METADATA_LIST.length);
    expect(CRITERES_STATS.automatiques + CRITERES_STATS.manuels).toBe(CRITERES_STATS.total);
    expect(CRITERES_STATS.poidsTotal).toBe(
      CRITERES_METADATA_LIST.reduce((somme, c) => somme + c.poids, 0),
    );
    expect(POIDS_TOTAL_AFFICHE).toBe(CRITERES_STATS.poidsTotal.toLocaleString("fr-FR"));
  });

  it("n'utilise que les trois sections attendues", () => {
    const sections = new Set(CRITERES_METADATA_LIST.map((c) => c.section));
    expect([...sections].sort()).toEqual(["environnement", "risques-zonages", "site-bati"]);
  });
});
