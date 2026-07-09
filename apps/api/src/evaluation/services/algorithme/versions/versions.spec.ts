import { describe, it, expect } from "vitest";
import { ALGORITHME_VERSIONS, VERSION_COURANTE, getAlgorithmeConfig } from "./index";

/**
 * Garde-fous sur le registre des versions d'algorithme.
 * Ordre chronologique ASCENDANT (la version courante est la dernière entrée) : c'est la
 * convention effective du code, l'endpoint GET /evaluation/algorithme/versions renvoie le
 * tableau dans cet ordre.
 */
describe("Registre des versions d'algorithme", () => {
  it("chaque version a une date au format ISO (YYYY-MM-DD)", () => {
    for (const v of ALGORITHME_VERSIONS) {
      expect(v.date, `date de ${v.version}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(v.date)), `date parsable de ${v.version}`).toBe(false);
    }
  });

  it("les dates sont en ordre chronologique non décroissant", () => {
    for (let i = 1; i < ALGORITHME_VERSIONS.length; i++) {
      const precedente = ALGORITHME_VERSIONS[i - 1];
      const courante = ALGORITHME_VERSIONS[i];
      expect(
        Date.parse(precedente.date) <= Date.parse(courante.date),
        `${precedente.version} (${precedente.date}) doit précéder ${courante.version} (${courante.date})`,
      ).toBe(true);
    }
  });

  it("les identifiants de version sont uniques", () => {
    const versions = ALGORITHME_VERSIONS.map((v) => v.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("VERSION_COURANTE correspond à la dernière entrée du registre", () => {
    const derniere = ALGORITHME_VERSIONS[ALGORITHME_VERSIONS.length - 1];
    expect(VERSION_COURANTE).toBe(derniere.version);
    expect(getAlgorithmeConfig(VERSION_COURANTE)).toBeDefined();
  });

  it("chaque version expose poids et matrice de scoring", () => {
    for (const v of ALGORITHME_VERSIONS) {
      expect(v.poidsCriteres, `poids de ${v.version}`).toBeDefined();
      expect(v.matriceScoring, `matrice de ${v.version}`).toBeDefined();
    }
  });
});
