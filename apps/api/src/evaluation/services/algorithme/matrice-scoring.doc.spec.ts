import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cheminDocMatrice, genererMatriceScoringMarkdown } from "./matrice-scoring.doc";

// Garde-fou : docs/matrice-scoring.md doit refléter MATRICE_SCORING, POIDS_CRITERES et REGLES_EXCLUSION
describe("docs/matrice-scoring.md", () => {
  it("est à jour avec l'algorithme (régénérer avec `pnpm docs:matrice:gen`)", () => {
    const actuel = readFileSync(cheminDocMatrice(), "utf8");
    expect(actuel).toBe(genererMatriceScoringMarkdown());
  });

  it("n'a aucun score inconnu (symbole « ? »)", () => {
    expect(genererMatriceScoringMarkdown()).not.toMatch(/\| \? \|/);
  });
});
