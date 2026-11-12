import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOSSIER_CAPTURES_QGIS,
  ETAPES_TUTORIEL_QGIS,
  QUESTIONS_TUTORIEL_QGIS,
} from "./tutoriel-qgis";

const DOSSIER_PUBLIC = resolve(__dirname, "../../../../public");

describe("tutoriel de l'extension QGIS", () => {
  const captures = ETAPES_TUTORIEL_QGIS.flatMap((etape) => etape.captures);

  it("illustre chaque étape par au moins une capture présente dans public/", () => {
    for (const etape of ETAPES_TUTORIEL_QGIS) {
      expect(etape.captures.length, etape.id).toBeGreaterThan(0);
    }
    for (const capture of captures) {
      const chemin = resolve(DOSSIER_PUBLIC, `.${DOSSIER_CAPTURES_QGIS}`, capture.fichier);
      expect(existsSync(chemin), capture.fichier).toBe(true);
    }
  });

  it("décrit chaque capture pour les lecteurs d'écran", () => {
    for (const capture of captures) {
      expect(capture.alt.length, capture.fichier).toBeGreaterThan(40);
    }
  });

  it("donne à chaque étape une ancre unique", () => {
    const ancres = ETAPES_TUTORIEL_QGIS.map((etape) => etape.id);
    expect(new Set(ancres).size).toBe(ancres.length);
  });

  it("ne présente jamais l'indice comme une probabilité de réussite", () => {
    const textes = [
      ...ETAPES_TUTORIEL_QGIS.flatMap((etape) => [...etape.paragraphes, etape.aSavoir ?? ""]),
      ...QUESTIONS_TUTORIEL_QGIS.map((q) => q.reponse),
    ].join(" ");
    expect(textes).not.toMatch(/chances? de réussite|probabilité de succès/i);
    expect(textes).toContain("n'est pas une probabilité de réussite");
  });
});
