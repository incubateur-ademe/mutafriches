import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAMPS_COMPLEMENTAIRES_REQUIS, USAGE_LABELS } from "@mutafriches/shared-types";
import { POIDS_CRITERES } from "./algorithme.config";

// Garde-fou : la doc métier de l'algorithme, écrite à la main, avait dérivé du code
// (27 critères au schéma, poids faux dans l'exemple, libellés d'usages inventés).
const doc: string = readFileSync(
  resolve(__dirname, "../../../../../../docs/evaluation-mutabilite.md"),
  "utf8",
);

interface LigneCritere {
  champ: string;
  poids: number;
}

function section(titre: string): string {
  return doc.split(titre)[1]?.split(/\n#{2,3} /)[0] ?? "";
}

// Lignes « | n | **Nom** | poids | valeurs | `champ` | » d'une liste de critères
function lignesCriteres(texte: string): LigneCritere[] {
  return [...texte.matchAll(/^\| \d+ \| \*\*.+?\*\* \| ([\d.]+) \|.*\| `(\w+)` \|$/gm)].map(
    (m) => ({ champ: m[2], poids: Number(m[1]) }),
  );
}

const poidsCode = POIDS_CRITERES as Record<string, number>;
const somme = (lignes: LigneCritere[]): number => lignes.reduce((t, l) => t + l.poids, 0);

describe("docs/evaluation-mutabilite.md — alignement sur POIDS_CRITERES", () => {
  const enrichis = lignesCriteres(section("### Critères enrichis automatiquement"));
  const saisis = lignesCriteres(section("### Critères complémentaires saisis"));
  const tous = [...enrichis, ...saisis];

  it("liste exactement les critères du code, avec leur poids", () => {
    expect(tous.map((l) => l.champ).sort()).toEqual(Object.keys(poidsCode).sort());
    for (const ligne of tous) expect(ligne.poids, ligne.champ).toBe(poidsCode[ligne.champ]);
  });

  it("annonce les bons décomptes dans les titres et la synthèse", () => {
    const total = Object.keys(poidsCode).length;
    const poidsTotal = Object.values(poidsCode).reduce((t, p) => t + p, 0);

    expect(doc).toContain(`### Critères enrichis automatiquement (${enrichis.length})`);
    expect(doc).toContain(`### Critères complémentaires saisis (${saisis.length})`);
    expect(doc).toContain(`## Liste des ${total} critères actifs`);
    expect(doc).toContain(
      `| Enrichissement automatique | ${enrichis.length} | ${somme(enrichis)} |`,
    );
    expect(doc).toContain(
      `| Données complémentaires (saisie) | ${saisis.length} | ${somme(saisis)} |`,
    );
    expect(doc).toContain(`| **TOTAL** | **${total}** | **${poidsTotal}** |`);
    expect(doc).toContain(`Le poids total est de **${poidsTotal}**`);
  });

  it("ne cite aucun autre nombre de critères", () => {
    const decomptes = [...doc.matchAll(/(\d+) (?:critères|CRITÈRES)/g)].map((m) => Number(m[1]));
    // Les critères réellement saisis : raccordementEau, dérivé, n'en fait pas partie
    const attendus = [
      Object.keys(poidsCode).length,
      enrichis.length,
      saisis.length,
      CHAMPS_COMPLEMENTAIRES_REQUIS.length,
    ];

    expect(decomptes.filter((n) => !attendus.includes(n))).toEqual([]);
  });

  it("nomme les usages avec les libellés de l'interface", () => {
    const usages = [
      ...section("### Les 7 usages évalués").matchAll(/^\| \*\*(.+?)\*\* \| `(\w+)` \|/gm),
    ].map((m) => [m[2], m[1]]);

    expect(Object.fromEntries(usages)).toEqual(USAGE_LABELS);
  });
});
