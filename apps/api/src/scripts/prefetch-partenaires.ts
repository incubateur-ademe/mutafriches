/* eslint-disable no-console */
/**
 * Script de pré-chauffe du cache d'enrichissement pour les sites des partenaires.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm partenaires:prefetch                      # tous les partenaires du registre
 *   PARTENAIRE=cci-92 pnpm partenaires:prefetch    # un seul partenaire (par slug)
 *   API_URL=https://mutafriches.beta.gouv.fr pnpm partenaires:prefetch
 *
 * Comportement :
 *   - Appelle POST /enrichissement pour chaque site (mono ou multi-parcelles)
 *   - Le serveur cache les résultats en PostgreSQL (TTL 24h, voir ENRICHISSEMENT_CACHE_TTL_HOURS)
 *   - Les visiteurs suivants de /partenaires/<slug> bénéficient du cache hit
 *
 * Recommandation de scheduling :
 *   - Quotidien (le TTL serveur est de 24h)
 *   - Après les 4h du matin (heure creuse, APIs tierces moins chargées)
 *
 * Variables d'environnement (lues via AppConfig, cf. ADR-0016) :
 *   - API_URL : base URL de l'API (défaut http://localhost:3000)
 *   - PARTENAIRE : slug d'un partenaire pour limiter le pré-chauffe (défaut : tous)
 *   - PARTENAIRES_PREFETCH_DELAY_MS : pause entre chaque appel (défaut 1000)
 */

import { getAppConfig } from "../config";
import { PARTENAIRES_PREFETCH } from "./partenaires/registry";
import { SitePrefetch } from "./partenaires/types";

const {
  apiUrl: API_URL,
  partenairesPrefetchDelayMs: DELAY_MS,
  partenaireFiltre: PARTENAIRE_FILTRE,
} = getAppConfig().scripts;

interface PrefetchResult {
  partenaire: string;
  idtup: string;
  commune: string;
  parcelles: number;
  success: boolean;
  durationMs: number;
  error?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function prefetchSite(partenaire: string, site: SitePrefetch): Promise<PrefetchResult> {
  const startTime = Date.now();
  const url = `${API_URL}/enrichissement?acceptDegradedCache=true`;

  try {
    const body =
      site.parcelles.length === 1
        ? { identifiant: site.parcelles[0] }
        : { identifiants: site.parcelles };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://mutafriches.beta.gouv.fr",
      },
      body: JSON.stringify(body),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const text = await response.text();
      return {
        partenaire,
        idtup: site.idtup,
        commune: site.commune,
        parcelles: site.parcelles.length,
        success: false,
        durationMs,
        error: `HTTP ${response.status} : ${text.slice(0, 200)}`,
      };
    }

    return {
      partenaire,
      idtup: site.idtup,
      commune: site.commune,
      parcelles: site.parcelles.length,
      success: true,
      durationMs,
    };
  } catch (err: unknown) {
    return {
      partenaire,
      idtup: site.idtup,
      commune: site.commune,
      parcelles: site.parcelles.length,
      success: false,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

// Construit la liste plate (partenaire, site) à traiter selon le filtre éventuel.
function resoudreSites(): { partenaire: string; site: SitePrefetch }[] {
  const slugs = PARTENAIRE_FILTRE ? [PARTENAIRE_FILTRE] : Object.keys(PARTENAIRES_PREFETCH);

  const sites: { partenaire: string; site: SitePrefetch }[] = [];
  for (const slug of slugs) {
    const partnerSites = PARTENAIRES_PREFETCH[slug];
    if (!partnerSites) {
      console.error(
        `Partenaire inconnu : "${slug}". Slugs disponibles : ${Object.keys(PARTENAIRES_PREFETCH).join(", ")}`,
      );
      process.exit(1);
    }
    for (const site of partnerSites) {
      sites.push({ partenaire: slug, site });
    }
  }
  return sites;
}

async function main(): Promise<void> {
  const aTraiter = resoudreSites();
  const partenaires = Array.from(new Set(aTraiter.map((s) => s.partenaire)));

  console.log(`Pré-chauffe du cache d'enrichissement partenaires`);
  console.log(`  - API : ${API_URL}`);
  console.log(`  - Partenaires : ${partenaires.join(", ") || "(aucun)"}`);
  console.log(`  - Sites à traiter : ${aTraiter.length}`);
  console.log(`  - Délai entre appels : ${DELAY_MS}ms`);
  console.log("");

  const results: PrefetchResult[] = [];
  let totalDuration = 0;

  for (let i = 0; i < aTraiter.length; i++) {
    const { partenaire, site } = aTraiter[i];
    const progress = `[${i + 1}/${aTraiter.length}]`;
    process.stdout.write(
      `${progress} ${partenaire.padEnd(8)} ${site.commune.padEnd(15)} ${site.idtup} ... `,
    );

    const result = await prefetchSite(partenaire, site);
    results.push(result);
    totalDuration += result.durationMs;

    if (result.success) {
      console.log(`OK (${result.durationMs}ms)`);
    } else {
      console.log(`ECHEC (${result.durationMs}ms) - ${result.error}`);
    }

    if (i < aTraiter.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const successes = results.filter((r) => r.success).length;
  const failures = results.length - successes;
  const avgDuration = results.length > 0 ? Math.round(totalDuration / results.length) : 0;

  console.log("");
  console.log(`Résumé :`);
  console.log(`  - Succès : ${successes}/${results.length}`);
  console.log(`  - Échecs : ${failures}/${results.length}`);
  console.log(`  - Durée moyenne par site : ${avgDuration}ms`);
  console.log(`  - Durée totale : ${Math.round(totalDuration / 1000)}s`);

  if (failures > 0) {
    console.log("");
    console.log(`Détails des échecs :`);
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - [${r.partenaire}] ${r.idtup} (${r.commune}) : ${r.error}`));
  }

  // Sortie en erreur uniquement si TOUS les sites ont échoué (= API HS)
  // Échecs partiels (parcelles individuelles invalides) → exit 0 pour ne pas
  // déclencher d'alarme sur le cron quotidien
  if (results.length > 0 && successes === 0) {
    console.error("");
    console.error("Aucun site n'a été pré-chauffé avec succès — API potentiellement HS.");
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
