import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOSSIER_CAPTURES_QGIS,
  ETAPES_TUTORIEL_QGIS,
  texteParagraphe,
  QUESTIONS_TUTORIEL_QGIS,
  URL_TELECHARGEMENT_EXTENSION,
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
      ...QUESTIONS_TUTORIEL_QGIS.map((q) => texteParagraphe(q.reponse)),
    ].join(" ");
    expect(textes).not.toMatch(/démonstration|données figées|mode développeur/i);
  });

  // Un lien vers la page des versions n'est pas un téléchargement : le bouton doit servir le ZIP
  it("télécharge le ZIP de la dernière version, sans numéro de version dans le lien", () => {
    expect(URL_TELECHARGEMENT_EXTENSION).toMatch(/\/releases\/latest\/download\/[a-z-]+\.zip$/);
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
      ...QUESTIONS_TUTORIEL_QGIS.map((q) => texteParagraphe(q.reponse)),
    ].join(" ");
    expect(textes).not.toMatch(/chances? de réussite|probabilité de succès/i);
  });
});
