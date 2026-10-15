/* eslint-disable no-console */
/**
 * Génère docs/matrice-scoring.md depuis la matrice de scoring.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm docs:matrice:gen            écrit le fichier
 *   pnpm docs:matrice:gen --check    échoue si le fichier diverge du code
 *
 * Script dev-only (non appelé au déploiement). Nécessite un build à jour de shared-types.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  cheminDocMatrice,
  genererMatriceScoringMarkdown,
} from "../evaluation/services/algorithme/matrice-scoring.doc";

const chemin = cheminDocMatrice();
const attendu = genererMatriceScoringMarkdown();

if (process.argv.includes("--check")) {
  const actuel = readFileSync(chemin, "utf8");
  if (actuel !== attendu) {
    console.error(
      "docs/matrice-scoring.md diverge de l'algorithme : lancer `pnpm docs:matrice:gen`.",
    );
    process.exit(1);
  }
  console.log("docs/matrice-scoring.md est à jour.");
} else {
  writeFileSync(chemin, attendu);
  console.log("docs/matrice-scoring.md régénéré.");
}
