/**
 * Retrouve les parcelles actuelles qui remplacent les parcelles partenaires disparues du
 * cadastre (division, fusion, renumérotation depuis le millésime des fichiers fonciers).
 *
 * Pour chaque site : parcelles absentes du dernier millésime Etalab (confirmé par apicarto,
 * source de l'enrichissement), géométrie au dernier millésime où elles existaient, puis
 * parcelles actuelles qui les recouvrent et restent majoritairement dans l'emprise du site.
 *
 * Ne modifie rien : produit un rapport à relire avant de mettre à jour les données
 * partenaires (UI, backend, base). Cf. ADR-0044.
 *
 * Usage (local, one-shot) :
 *   pnpm --filter api build:nest
 *   PARTENAIRE=<slug> node dist/src/scripts/reconcilier-cadastre-partenaire.js
 *
 * Sortie : cadastre-successeurs/data/<slug>.rapport.json
 */
import { writeFileSync } from "fs";
import { join, sep } from "path";
import { padParcelleSection, parcelleAvecPrefixe } from "@mutafriches/shared-types";
import { parcellesByAttributes } from "./coord-to-idu/apicarto.client";
import { listerMillesimes, parcellesCommune } from "./cadastre-successeurs/etalab-cadastre.client";
import {
  calculerSuccesseurs,
  ResultatSuccession,
  Surface,
  unir,
} from "./cadastre-successeurs/successeurs";
import { PARTENAIRES_PREFETCH } from "./partenaires/registry";
import type { SitePrefetch } from "./partenaires/types";
import { getAppConfig } from "../config";

const SRC_SCRIPTS = __dirname.replace(`${sep}dist${sep}`, sep);
const DATA_DIR = join(SRC_SCRIPTS, "cadastre-successeurs", "data");
const DELAY_MS = 300; // politesse envers apicarto

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface ParcelleDisparue {
  id: string;
  dernierMillesime: string | null; // null : introuvable dans les archives
}

interface RapportSite extends Omit<ResultatSuccession, "successeurs"> {
  idtup: string;
  commune: string;
  parcellesAvant: string[];
  disparues: ParcelleDisparue[];
  successeurs: (ResultatSuccession["successeurs"][number] & { confirmeApicarto: boolean })[];
  parcellesApres: string[];
}

function codeInseeDe(idu: string): string {
  return idu.slice(0, 5);
}

// Présence de la parcelle côté apicarto (source effectivement interrogée par l'enrichissement).
async function existeSurApicarto(idu: string): Promise<boolean> {
  const id = padParcelleSection(idu);
  const prefixe = id.slice(5, 8);
  const section = id.slice(8, 10);
  const numero = id.slice(10, 14);
  const reponse = await parcellesByAttributes(codeInseeDe(id), section, numero);
  await sleep(DELAY_MS);
  return reponse !== null && parcelleAvecPrefixe(reponse, prefixe) !== null;
}

async function geometrieHistorique(
  idu: string,
  millesimesAnterieurs: string[],
): Promise<{ millesime: string; surface: Surface } | null> {
  for (const millesime of millesimesAnterieurs) {
    const surface = (await parcellesCommune(millesime, codeInseeDe(idu)))?.get(idu);
    if (surface) return { millesime, surface };
  }
  return null;
}

async function analyserSite(
  site: SitePrefetch,
  courant: string,
  anterieurs: string[],
): Promise<RapportSite | null> {
  const parcelles = site.parcelles.map(padParcelleSection);
  const actuellesParCommune = new Map<string, Map<string, Surface>>();
  for (const insee of new Set(parcelles.map(codeInseeDe))) {
    actuellesParCommune.set(insee, (await parcellesCommune(courant, insee)) ?? new Map());
  }

  const absentesEtalab = parcelles.filter(
    (id) => !actuellesParCommune.get(codeInseeDe(id)).has(id),
  );
  if (absentesEtalab.length === 0) return null;

  // Etalab peut devancer ou suivre apicarto d'un trimestre : on ne retient que les absences confirmées
  const disparuesIds: string[] = [];
  for (const id of absentesEtalab) {
    if (!(await existeSurApicarto(id))) disparuesIds.push(id);
  }
  if (disparuesIds.length === 0) return null;

  const disparues: ParcelleDisparue[] = [];
  const surfacesDisparues: Surface[] = [];
  for (const id of disparuesIds) {
    const historique = await geometrieHistorique(id, anterieurs);
    disparues.push({ id, dernierMillesime: historique?.millesime ?? null });
    if (historique) surfacesDisparues.push(historique.surface);
  }

  const presentes = parcelles.filter((id) => !disparuesIds.includes(id));
  const surfacesPresentes = presentes
    .map((id) => actuellesParCommune.get(codeInseeDe(id)).get(id))
    .filter((s): s is Surface => s !== undefined);
  const emprise = unir([...surfacesPresentes, ...surfacesDisparues]);

  const actuelles = Array.from(actuellesParCommune.values()).flatMap((m) => Array.from(m.values()));
  const resultat = emprise
    ? calculerSuccesseurs(surfacesDisparues, emprise, actuelles, new Set(presentes))
    : { successeurs: [], ecartes: [], couverture: 0 };

  const successeurs = [];
  for (const s of resultat.successeurs) {
    successeurs.push({ ...s, confirmeApicarto: await existeSurApicarto(s.id) });
  }

  return {
    idtup: site.idtup,
    commune: site.commune,
    parcellesAvant: site.parcelles,
    disparues,
    successeurs,
    ecartes: resultat.ecartes,
    couverture: resultat.couverture,
    parcellesApres: [
      ...site.parcelles.filter((id) => !disparuesIds.includes(padParcelleSection(id))),
      ...successeurs.filter((s) => s.confirmeApicarto).map((s) => s.id),
    ],
  };
}

async function main(): Promise<void> {
  const filtre = getAppConfig().scripts.partenaireFiltre;
  const slugs = filtre ? [filtre] : Object.keys(PARTENAIRES_PREFETCH);
  const [courant, ...anterieurs] = await listerMillesimes();
  console.info(`Millésime courant Etalab : ${courant}`);

  for (const slug of slugs) {
    const sites = PARTENAIRES_PREFETCH[slug];
    if (!sites) throw new Error(`Partenaire inconnu : ${slug}`);

    const rapports: RapportSite[] = [];
    for (const site of sites) {
      const rapport = await analyserSite(site, courant, anterieurs);
      if (!rapport) continue;
      rapports.push(rapport);
      console.info(
        `  ${rapport.idtup} (${rapport.commune}) : ${rapport.disparues.length} disparue(s) -> ` +
          `${rapport.successeurs.map((s) => s.id).join(", ") || "aucun successeur"} ` +
          `(couverture ${Math.round(rapport.couverture * 100)} %)`,
      );
    }

    const chemin = join(DATA_DIR, `${slug}.rapport.json`);
    writeFileSync(
      chemin,
      JSON.stringify({ millesimeCourant: courant, sites: rapports }, null, 2) + "\n",
    );
    console.info(
      `Partenaire ${slug} : ${rapports.length}/${sites.length} site(s) touché(s) -> ${chemin}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Erreur réconciliation cadastre : ${message}`);
    process.exit(1);
  });
