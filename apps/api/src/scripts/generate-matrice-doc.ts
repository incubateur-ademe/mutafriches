/* eslint-disable no-console */
/**
 * Génère docs/matrice-scoring.md et les données de la page « Comprendre les analyses »
 * (shared-types) depuis la matrice de scoring.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm docs:matrice:gen            écrit les fichiers
 *   pnpm docs:matrice:gen --check    échoue si un fichier diverge du code
 *
 * Script dev-only (non appelé au déploiement). Nécessite un build à jour de shared-types.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  cheminDocMatrice,
  cheminDonneesMatrice,
  genererMatriceScoringMarkdown,
  serialiserMatriceScoringDonnees,
} from "../evaluation/services/algorithme/matrice-scoring.doc";

const fichiers: { chemin: string; attendu: string }[] = [
  { chemin: cheminDocMatrice(), attendu: genererMatriceScoringMarkdown() },
  { chemin: cheminDonneesMatrice(), attendu: serialiserMatriceScoringDonnees() },
];

if (process.argv.includes("--check")) {
  const divergents = fichiers.filter(
    ({ chemin, attendu }) => readFileSync(chemin, "utf8") !== attendu,
  );
  if (divergents.length) {
    console.error(
      `Divergence avec l'algorithme (${divergents.map((f) => f.chemin).join(", ")}) : lancer \`pnpm docs:matrice:gen\`.`,
    );
    process.exit(1);
  }
  console.log("Matrice de scoring à jour (Markdown et données UI).");
} else {
  for (const { chemin, attendu } of fichiers) writeFileSync(chemin, attendu);
  console.log("Matrice de scoring régénérée (Markdown et données UI).");
}
