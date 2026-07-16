/**
 * Résolution des IDU cadastraux du partenaire SCET (inventaire des friches de la
 * CC du Pays de Montereau) à partir des coordonnées Lambert-93 et des numéros de parcelle.
 *
 * Le fichier fourni par le SCET ne contient pas d'IDU. Ce script :
 *   1. décompose le champ "num_parcelle" en couples (section, numéro) ;
 *   2. résout l'IDU réel de chaque parcelle via l'API Carto Cadastre (par attributs) ;
 *   3. contre-vérifie par les coordonnées (reprojection Lambert-93 → WGS84 puis geom) ;
 *   4. génère les fichiers de données partenaire (UI + backend) et un rapport.
 *
 * Usage (local, one-shot) :
 *   pnpm --filter api build:nest && node dist/src/scripts/resolve-idu-scet.js
 *
 * Sorties (dans coord-to-idu/data/) :
 *   - scet.resolved.json           : résolution complète (audit)
 *   - scet.parcelles.generated.ts  : PartnerParcelle[] pour l'UI
 *   - scet.sites.generated.ts      : SitePrefetch[] pour le backend (seed/prefetch)
 */
import { readFileSync, writeFileSync } from "fs";
import { join, sep } from "path";
import { resolveSite, SiteInput, SiteResolution } from "./coord-to-idu/resolve";

// Lecture/écriture dans l'arbre source (les données ne sont pas copiées dans dist par nest build).
const SRC_SCRIPTS = __dirname.replace(`${sep}dist${sep}`, sep);
const DATA_DIR = join(SRC_SCRIPTS, "coord-to-idu", "data");
const REPO_ROOT = join(SRC_SCRIPTS, "..", "..", "..", "..");
const UI_PARCELLES = join(REPO_ROOT, "apps/ui/src/features/partenaires/partners/scet/parcelles.ts");
const BACKEND_SITES = join(SRC_SCRIPTS, "partenaires", "scet.ts");
const DELAY_MS = 300; // politesse envers apicarto

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function idtupFor(site: SiteResolution): string {
  return `scet-${site.id}`;
}

// Nom de commune officiel (INSEE, accentué/tiret) renvoyé par l'API, sinon celui du partenaire.
function communeFor(site: SiteResolution): string {
  return site.parcelles.find((p) => p.commune)?.commune ?? site.commune;
}

// Échappe une chaîne pour une string littérale TypeScript.
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function genParcellesTs(resolutions: SiteResolution[]): string {
  const lignes: string[] = [];
  for (const site of resolutions) {
    const idtup = idtupFor(site);
    const commune = communeFor(site);
    for (const idu of site.idusValides) {
      lignes.push(`  { idpar: "${idu}", commune: "${esc(commune)}", idtup: "${idtup}" },`);
    }
  }
  return (
    `import type { PartnerParcelle } from "../../core/types";\n\n` +
    `// Parcelles du SCET (friches de la CC du Pays de Montereau, 77), regroupées par idtup.\n` +
    `// Source : inventaire SCET 2025, IDU résolus via API Carto Cadastre (resolve-idu-scet).\n` +
    `export const PARCELLES_SCET: PartnerParcelle[] = [\n${lignes.join("\n")}\n];\n`
  );
}

function genSitesTs(resolutions: SiteResolution[]): string {
  const blocs: string[] = [];
  for (const site of resolutions) {
    const parcelles = site.idusValides.map((idu) => `      "${idu}",`).join("\n");
    blocs.push(
      `  {\n` +
        `    idtup: "${idtupFor(site)}",\n` +
        `    commune: "${esc(communeFor(site))}",\n` +
        `    parcelles: [\n${parcelles}\n    ],\n` +
        `    nom: "${esc(site.nom)}",\n` +
        `  },`,
    );
  }
  return (
    `import { SitePrefetch } from "./types";\n\n` +
    `// Sites du SCET (friches de la CC du Pays de Montereau, 77). Source : inventaire SCET 2025.\n` +
    `export const SCET_SITES: SitePrefetch[] = [\n${blocs.join("\n")}\n];\n`
  );
}

async function main(): Promise<void> {
  const inputs = JSON.parse(
    readFileSync(join(DATA_DIR, "scet.input.json"), "utf-8"),
  ) as SiteInput[];

  console.info(`Résolution de ${inputs.length} sites SCET...\n`);

  const resolutions: SiteResolution[] = [];
  for (const input of inputs) {
    const res = await resolveSite(input);
    resolutions.push(res);
    const nb = res.idusValides.length;
    console.info(
      `[${res.statut.padEnd(8)}] scet-${res.id.padEnd(3)} ${res.commune} — ${nb} parcelle(s)` +
        (res.messages.length > 0 ? `\n            ${res.messages.join("\n            ")}` : ""),
    );
    await sleep(DELAY_MS);
  }

  // Rapport de synthèse.
  const parStatut = resolutions.reduce<Record<string, number>>((acc, r) => {
    acc[r.statut] = (acc[r.statut] ?? 0) + 1;
    return acc;
  }, {});
  const totalIdu = resolutions.reduce((n, r) => n + r.idusValides.length, 0);
  console.info(`\n=== Synthèse ===`);
  console.info(`Sites : ${resolutions.length}, IDU résolus : ${totalIdu}`);
  console.info(`Statuts : ${JSON.stringify(parStatut)}`);
  const aRevoir = resolutions.filter((r) => r.statut !== "OK");
  if (aRevoir.length > 0) {
    console.info(
      `\nÀ revoir (${aRevoir.length}) : ${aRevoir.map((r) => `scet-${r.id}`).join(", ")}`,
    );
  }

  // Écriture des sorties (seuls les sites avec au moins un IDU valide sont exportés).
  const exportables = resolutions.filter((r) => r.idusValides.length > 0);
  writeFileSync(join(DATA_DIR, "scet.resolved.json"), JSON.stringify(resolutions, null, 2));
  writeFileSync(UI_PARCELLES, genParcellesTs(exportables));
  writeFileSync(BACKEND_SITES, genSitesTs(exportables));
  console.info(`\nAudit : ${join(DATA_DIR, "scet.resolved.json")}`);
  console.info(`UI    : ${UI_PARCELLES}`);
  console.info(`API   : ${BACKEND_SITES}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
