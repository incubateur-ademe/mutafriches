/**
 * Génère docs/sources-donnees-externes.md à partir de SOURCES_DONNEES (shared-types).
 *
 * Source de vérité unique partagée avec la page UI et l'export PDF : ce document ne doit
 * PAS être édité à la main. Régénérer via `pnpm docs:sources:gen` après toute évolution
 * des sources ou de l'algorithme (les critères et poids sont dérivés de CRITERES_METADATA).
 *
 * Script dev-only (non appelé au déploiement). Nécessite un build à jour de shared-types
 * (`pnpm --filter shared-types build`).
 */
const { writeFileSync } = require("fs");
const { resolve } = require("path");
const {
  SOURCES_DONNEES,
  getCriteresManuels,
  getCriteresPourSource,
} = require("../packages/shared-types/dist/index.js");

const TYPE_LABELS = {
  "api-externe": "API externe",
  "referentiel-local": "Référentiel local",
};

function tableauCriteres(criteres) {
  const lignes = criteres.map((c) => `| ${c.label} | ${c.poids} |`);
  return ["| Critère d'évaluation alimenté | Poids |", "| --- | --- |", ...lignes].join("\n");
}

function blocSource(source) {
  const champs = source.champsRecuperes.map((c) => `- ${c}`).join("\n");
  return [
    `### ${source.nom}`,
    "",
    `- **Type** : ${TYPE_LABELS[source.type]}`,
    `- **Opérateur** : ${source.organisme}`,
    `- **Documentation** : ${source.urlDoc}`,
    "",
    "**Champs récupérés**",
    "",
    champs,
    "",
    "**Traitement dans l'algorithme**",
    "",
    source.traitementAlgo,
    "",
    "**Critères d'évaluation alimentés**",
    "",
    tableauCriteres(getCriteresPourSource(source)),
  ].join("\n");
}

function genererMarkdown() {
  const sources = SOURCES_DONNEES.map(blocSource).join("\n\n");
  return [
    "# Sources de données externes",
    "",
    "> Document généré automatiquement par `pnpm docs:sources:gen` à partir de",
    "> `SOURCES_DONNEES` (packages/shared-types). Ne pas éditer à la main : la page UI",
    "> `/documentation-donnees` et l'export PDF partagent la même source de vérité.",
    "",
    "Pour chaque source de données externe mobilisée par Mutafriches : les champs récupérés,",
    "la façon dont ils sont traités dans l'algorithme de mutabilité, et les critères d'évaluation",
    "qu'ils alimentent.",
    "",
    "## Comment sont utilisées ces données",
    "",
    "L'analyse de mutabilité repose sur 27 critères, notés pour 7 usages possibles d'une friche.",
    "17 critères sont **enrichis automatiquement** à partir des sources ci-dessous ; 10 sont",
    "**saisis manuellement** par l'utilisateur. Chaque critère porte un poids ; le poids total",
    "est de 29,5. La part des critères effectivement renseignés détermine l'indice de fiabilité",
    "de l'analyse.",
    "",
    "## Sources enrichies automatiquement",
    "",
    sources,
    "",
    "## Critères saisis manuellement",
    "",
    "Ces critères ne proviennent pas d'une source externe : ils sont renseignés par l'utilisateur",
    "lors de la qualification du site. Le raccordement à l'eau est un cas particulier, dérivé",
    "automatiquement de la surface bâtie (cf. ADR-0019).",
    "",
    tableauCriteres(getCriteresManuels()),
    "",
  ].join("\n");
}

const cheminSortie = resolve(__dirname, "../docs/sources-donnees-externes.md");
writeFileSync(cheminSortie, genererMarkdown(), "utf-8");
console.log(`Documentation générée : ${cheminSortie}`);
