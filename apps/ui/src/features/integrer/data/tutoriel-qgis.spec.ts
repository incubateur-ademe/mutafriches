import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOSSIER_CAPTURES_QGIS,
  ETAPES_TUTORIEL_QGIS,
  texteParagraphe,
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

  it("ne parle plus de démonstration ni de mode développeur", () => {
    const textes = [
      ...ETAPES_TUTORIEL_QGIS.flatMap((etape) => [
        ...etape.paragraphes.map(texteParagraphe),
        ...etape.captures.map((capture) => capture.alt),
        etape.aSavoir ?? "",
        etape.attention ?? "",
      ]),
      ...QUESTIONS_TUTORIEL_QGIS.map((q) => q.reponse),
    ].join(" ");
    expect(textes).not.toMatch(/démonstration|données figées|mode développeur/i);
  });

  it("donne à chaque étape une ancre unique", () => {
    const ancres = ETAPES_TUTORIEL_QGIS.map((etape) => etape.id);
    expect(new Set(ancres).size).toBe(ancres.length);
  });

  it("ne présente jamais l'indice comme une probabilité de réussite", () => {
    const textes = [
      ...ETAPES_TUTORIEL_QGIS.flatMap((etape) => [
        ...etape.paragraphes.map(texteParagraphe),
        etape.aSavoir ?? "",
        etape.attention ?? "",
      ]),
      ...QUESTIONS_TUTORIEL_QGIS.map((q) => q.reponse),
    ].join(" ");
    expect(textes).not.toMatch(/chances? de réussite|probabilité de succès/i);
  });
});
