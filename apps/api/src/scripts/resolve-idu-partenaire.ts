/**
 * Génère les fichiers de données d'un partenaire à partir d'un inventaire brut qui ne porte
 * pas d'IDU cadastral (cas courant : un tableur « commune + numéros de parcelle »).
 *
 * Le script :
 *   1. décompose le champ "numParcelle" en références (préfixe COM_ABS, section, numéro) ;
 *   2. résout le code INSEE de la commune si l'inventaire ne le donne pas (BAN) ;
 *   3. résout l'IDU réel de chaque parcelle via l'API Carto Cadastre (par attributs) ;
 *   4. contre-vérifie par les coordonnées quand la source en fournit (Lambert-93) ;
 *   5. génère les fichiers de données partenaire (UI + backend) et un rapport d'audit.
 *
 * Usage (local, one-shot — apicarto et la BAN doivent être joignables) :
 *   pnpm --filter api build:nest
 *   PARTENAIRE=<slug> node dist/src/scripts/resolve-idu-partenaire.js
 *
 * Entrée  : coord-to-idu/data/<slug>.input.json     (SiteInput[])
 * Sorties : coord-to-idu/data/<slug>.resolved.json  (audit)
 *           apps/ui/src/features/partenaires/partners/<slug>/parcelles.ts
 *           apps/api/src/scripts/partenaires/<slug>.ts
 *
 * Seuls les sites dont au moins un IDU est résolu sont exportés : un IDU inventé ferait
 * échouer la pré-chauffe et afficherait une parcelle fausse à l'utilisateur.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, sep } from "path";
import { resolveSite, SiteInput, SiteResolution } from "./coord-to-idu/resolve";
import { DESCRIPTEURS, DescripteurResolution } from "./coord-to-idu/partenaires.config";

// Lecture/écriture dans l'arbre source (les données ne sont pas copiées dans dist par nest build).
const SRC_SCRIPTS = __dirname.replace(`${sep}dist${sep}`, sep);
const DATA_DIR = join(SRC_SCRIPTS, "coord-to-idu", "data");
const REPO_ROOT = join(SRC_SCRIPTS, "..", "..", "..", "..");
const DELAY_MS = 300; // politesse envers apicarto

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function cheminUiParcelles(slug: string): string {
  return join(REPO_ROOT, "apps/ui/src/features/partenaires/partners", slug, "parcelles.ts");
}

function cheminBackendSites(slug: string): string {
  return join(SRC_SCRIPTS, "partenaires", `${slug}.ts`);
}

function idtupFor(descripteur: DescripteurResolution, site: SiteResolution): string {
  return `${descripteur.prefixeIdtup}-${site.id}`;
}

// Nom de commune officiel (INSEE, accentué/tiret) renvoyé par l'API, sinon celui du partenaire.
function communeFor(site: SiteResolution): string {
  return site.parcelles.find((p) => p.commune)?.commune ?? site.commune;
}

// Échappe une chaîne pour une string littérale TypeScript.
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function genParcellesTs(descripteur: DescripteurResolution, resolutions: SiteResolution[]): string {
  const lignes: string[] = [];
  for (const site of resolutions) {
    const idtup = idtupFor(descripteur, site);
    const commune = communeFor(site);
    for (const idu of site.idusValides) {
      lignes.push(`  { idpar: "${idu}", commune: "${esc(commune)}", idtup: "${idtup}" },`);
    }
  }
  return (
    `import type { PartnerParcelle } from "../../core/types";\n\n` +
    `// Fichier généré par resolve-idu-partenaire — ne pas éditer à la main.\n` +
    `// Source : ${descripteur.source}, IDU résolus via API Carto Cadastre.\n` +
    `export const ${descripteur.constanteParcelles}: PartnerParcelle[] = [\n` +
    `${lignes.join("\n")}\n];\n`
  );
}

function genSitesTs(descripteur: DescripteurResolution, resolutions: SiteResolution[]): string {
  const blocs: string[] = [];
  for (const site of resolutions) {
    const parcelles = site.idusValides.map((idu) => `      "${idu}",`).join("\n");
    // Libellé omis quand l'inventaire n'en fournit pas : le nom par défaut (rue la plus
    // proche, ADR-0021) prend le relais. C'est le cas des sites dont le libellé source
    // identifiait une personne physique et a donc été retiré à l'anonymisation.
    const nom = site.nom ? `    nom: "${esc(site.nom)}",\n` : "";
    blocs.push(
      `  {\n` +
        `    idtup: "${idtupFor(descripteur, site)}",\n` +
        `    commune: "${esc(communeFor(site))}",\n` +
        `    parcelles: [\n${parcelles}\n    ],\n` +
        nom +
        `  },`,
    );
  }
  return (
    `import { SitePrefetch } from "./types";\n\n` +
    `// Fichier généré par resolve-idu-partenaire — ne pas éditer à la main.\n` +
    `// Source : ${descripteur.source}.\n` +
    `export const ${descripteur.constanteSites}: SitePrefetch[] = [\n${blocs.join("\n")}\n];\n`
  );
}

function descripteurDemande(): DescripteurResolution {
  const slug = process.env.PARTENAIRE;
  if (!slug) {
    throw new Error(
      `PARTENAIRE non renseigné. Slugs disponibles : ${Object.keys(DESCRIPTEURS).join(", ")}`,
    );
  }
  const descripteur = DESCRIPTEURS[slug];
  if (!descripteur) {
    throw new Error(
      `Slug inconnu : "${slug}". Disponibles : ${Object.keys(DESCRIPTEURS).join(", ")}`,
    );
  }
  return descripteur;
}

async function main(): Promise<void> {
  const descripteur = descripteurDemande();
  const cheminEntree = join(DATA_DIR, `${descripteur.slug}.input.json`);
  const inputs = (JSON.parse(readFileSync(cheminEntree, "utf-8")) as SiteInput[]).map((site) => ({
    ...site,
    departement: site.departement ?? descripteur.departement,
  }));

  console.info(`Résolution de ${inputs.length} sites (${descripteur.slug})...\n`);

  const resolutions: SiteResolution[] = [];
  for (const input of inputs) {
    const res = await resolveSite(input);
    resolutions.push(res);
    const nb = res.idusValides.length;
    console.info(
      `[${res.statut.padEnd(8)}] ${idtupFor(descripteur, res).padEnd(14)} ${res.commune} — ${nb} parcelle(s)` +
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
      `\nÀ revoir (${aRevoir.length}) : ` + aRevoir.map((r) => idtupFor(descripteur, r)).join(", "),
    );
  }

  // Écriture des sorties (seuls les sites avec au moins un IDU valide sont exportés).
  const exportables = resolutions.filter((r) => r.idusValides.length > 0);
  const cheminAudit = join(DATA_DIR, `${descripteur.slug}.resolved.json`);
  const cheminUi = cheminUiParcelles(descripteur.slug);
  const cheminBackend = cheminBackendSites(descripteur.slug);

  writeFileSync(cheminAudit, JSON.stringify(resolutions, null, 2));
  writeFileSync(cheminUi, genParcellesTs(descripteur, exportables));
  writeFileSync(cheminBackend, genSitesTs(descripteur, exportables));
  console.info(`\nAudit : ${cheminAudit}`);
  console.info(`UI    : ${cheminUi}`);
  console.info(`API   : ${cheminBackend}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
