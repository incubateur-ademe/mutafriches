import { existsSync, readFileSync } from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { IMPORT_DATASETS } from "./imports.registry";

const RACINE_API = path.resolve(__dirname, "../..");

// Scripts `db:*:import` déclarés dans package.json, indexés par fichier compilé
function scriptsImportDeclares(): Map<string, string> {
  const pkg = JSON.parse(readFileSync(path.join(RACINE_API, "package.json"), "utf-8")) as {
    scripts: Record<string, string>;
  };
  const resultat = new Map<string, string>();
  for (const [nom, commande] of Object.entries(pkg.scripts)) {
    if (!/^db:[a-z-]+:import$/.test(nom)) continue;
    const fichier = /dist\/src\/scripts\/([a-z-]+)\.js/.exec(commande)?.[1];
    if (fichier) resultat.set(fichier, nom);
  }
  return resultat;
}

// Garde-fou : sans entrée au registre, un nouvel import n'est jamais lancé au déploiement
// (`import-all`, ADR-0050) et la table reste vide sans que rien ne le signale.
describe("IMPORT_DATASETS — cohérence avec les scripts d'import", () => {
  it("a des clés uniques", () => {
    const cles = IMPORT_DATASETS.map((d) => d.key);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("couvre chaque script `db:*:import` de package.json", () => {
    const declares = scriptsImportDeclares();
    const enregistres = new Set(IMPORT_DATASETS.map((d) => d.script));

    const manquants = [...declares.entries()]
      .filter(([fichier]) => !enregistres.has(fichier))
      .map(([, nom]) => nom);

    expect(manquants, `scripts sans entrée dans IMPORT_DATASETS : ${manquants.join(", ")}`).toEqual(
      [],
    );
  });

  it("ne référence que des scripts déclarés et présents dans les sources", () => {
    const declares = scriptsImportDeclares();

    for (const dataset of IMPORT_DATASETS) {
      expect(declares.has(dataset.script), `${dataset.key} : script non déclaré`).toBe(true);
      expect(
        existsSync(path.join(RACINE_API, "src/scripts", `${dataset.script}.ts`)),
        `${dataset.key} : src/scripts/${dataset.script}.ts introuvable`,
      ).toBe(true);
    }
  });
});
