import { readFileSync } from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { IMPORT_DATASETS } from "./imports.registry";

const RACINE_DEPOT = path.resolve(__dirname, "../../../..");

function lire(chemin: string): string {
  return readFileSync(path.join(RACINE_DEPOT, chemin), "utf-8");
}

// Tables `raw_*` du registre : seules les bases d'enrichissement sont documentées
const tablesRegistre: string[] = IMPORT_DATASETS.map((d) => d.countTable)
  .filter((table) => table.startsWith("raw_"))
  .sort();

// Garde-fou : la doc de l'enrichissement dérivait du code à chaque nouveau référentiel
// (8 bases documentées pour 11 réelles en octobre 2026). Le registre fait foi.
describe("docs/enrichissement.md — alignement sur IMPORT_DATASETS", () => {
  const doc: string = lire("docs/enrichissement.md");
  const section: string = doc.split("### Bases Locales")[1]?.split("\n---")[0] ?? "";

  it("liste exactement les tables raw_* du registre", () => {
    const tablesDoc: string[] = [...section.matchAll(/\|\s*(raw_[a-z_]+)\s*\|/g)]
      .map((m) => m[1])
      .sort();

    expect(tablesDoc).toEqual(tablesRegistre);
  });

  it("annonce le bon décompte dans le titre et la ligne TOTAL", () => {
    const titre = /^\s*\((\d+)\)/.exec(section)?.[1];
    const total = /\*\*TOTAL\*\*[^\n]*\*\*(\d+)\*\*/.exec(section)?.[1];

    expect(Number(titre)).toBe(tablesRegistre.length);
    expect(Number(total)).toBe(tablesRegistre.length);
  });

  it.each(["docs/enrichissement.md", "docs/README.md", "README.md"])(
    "%s : tout décompte « N bases locales » correspond au registre",
    (fichier: string) => {
      const decomptes: number[] = [...lire(fichier).matchAll(/(\d+) bases locales/g)].map((m) =>
        Number(m[1]),
      );

      expect(decomptes.filter((n) => n !== tablesRegistre.length)).toEqual([]);
    },
  );
});
