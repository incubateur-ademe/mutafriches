/* eslint-disable no-console */
/**
 * Script de pré-chauffe du cache d'enrichissement pour les sites CCI 92.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm cci92:prefetch
 *   API_URL=https://mutafriches.beta.gouv.fr pnpm cci92:prefetch
 *
 * Comportement :
 *   - Appelle POST /enrichissement pour chaque site CCI 92 (mono ou multi-parcelles)
 *   - Le serveur cache les résultats en PostgreSQL (TTL 24h, voir ENRICHISSEMENT_CACHE_TTL_HOURS)
 *   - Les visiteurs suivants de /partenaires/cci-92 bénéficient du cache hit
 *
 * Recommandation de scheduling :
 *   - Quotidien (le TTL serveur est de 24h)
 *   - Après les 4h du matin (heure creuse, APIs tierces moins chargées)
 *
 * Variables d'environnement :
 *   - API_URL : base URL de l'API (défaut http://localhost:3000)
 *   - CCI92_PREFETCH_DELAY_MS : pause entre chaque appel (défaut 1000)
 */

import { getAppConfig } from "../config";

interface SiteCCI92 {
  idtup: string;
  commune: string;
  parcelles: string[];
}

// Liste statique miroir de apps/ui/src/features/partenaires/partners/cci92/parcelles.ts
// Si la liste change côté UI, mettre à jour ici aussi.
const CCI92_SITES: SiteCCI92[] = [
  {
    idtup: "uf920250027182",
    commune: "COLOMBES",
    parcelles: [
      "920250000B0203",
      "920250000B0206",
      "920250000B0245",
      "920250000B0259",
      "920250000B0253",
      "920250000B0254",
      "920250000B0260",
    ],
  },
  { idtup: "92025000BY0265", commune: "COLOMBES", parcelles: ["92025000BY0265"] },
  { idtup: "920360000E0031", commune: "GENNEVILLIERS", parcelles: ["920360000E0031"] },
  { idtup: "920360000E0064", commune: "GENNEVILLIERS", parcelles: ["920360000E0064"] },
  { idtup: "920360000E0137", commune: "GENNEVILLIERS", parcelles: ["920360000E0137"] },
  {
    idtup: "uf920360030903",
    commune: "GENNEVILLIERS",
    parcelles: [
      "920360000J0440",
      "920360000J0001",
      "920360000J0003",
      "920360000J0451",
      "920360000J0461",
      "920360000K0255",
      "920360000K0282",
      "920360000L0162",
    ],
  },
  {
    idtup: "uf920360029310",
    commune: "GENNEVILLIERS",
    parcelles: [
      "920360000J0007",
      "920360000J0008",
      "920360000J0009",
      "920360000J0010",
      "920360000J0247",
      "920360000K0080",
      "920360000K0083",
    ],
  },
  { idtup: "920360000L0163", commune: "GENNEVILLIERS", parcelles: ["920360000L0163"] },
  { idtup: "920360000L0164", commune: "GENNEVILLIERS", parcelles: ["920360000L0164"] },
  { idtup: "920360000L0266", commune: "GENNEVILLIERS", parcelles: ["920360000L0266"] },
  {
    idtup: "uf920360007881",
    commune: "GENNEVILLIERS",
    parcelles: [
      "920360000N0111",
      "920360000N0144",
      "920360000N0146",
      "920360000N0148",
      "920360000N0155",
    ],
  },
  { idtup: "920360000O0117", commune: "GENNEVILLIERS", parcelles: ["920360000O0117"] },
  {
    idtup: "uf920360030900",
    commune: "GENNEVILLIERS",
    parcelles: ["92036000AN0035", "92036000AN0067", "92036000AN0070"],
  },
  { idtup: "920500000D0085", commune: "NANTERRE", parcelles: ["920500000D0085"] },
  {
    idtup: "uf920500010227",
    commune: "NANTERRE",
    parcelles: [
      "920500000K0002",
      "920500000K0059",
      "920500000L0027",
      "920500000L0029",
      "920500000L0031",
      "920500000L0033",
      "920500000L0055",
    ],
  },
  {
    idtup: "uf920500026067",
    commune: "NANTERRE",
    parcelles: ["920500000N0559", "920500000N0560", "920500000N0562"],
  },
];

const API_URL = getAppConfig().scripts.apiUrl;
const DELAY_MS = getAppConfig().scripts.cci92PrefetchDelayMs;

interface PrefetchResult {
  idtup: string;
  commune: string;
  parcelles: number;
  success: boolean;
  durationMs: number;
  error?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function prefetchSite(site: SiteCCI92): Promise<PrefetchResult> {
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
        idtup: site.idtup,
        commune: site.commune,
        parcelles: site.parcelles.length,
        success: false,
        durationMs,
        error: `HTTP ${response.status} : ${text.slice(0, 200)}`,
      };
    }

    return {
      idtup: site.idtup,
      commune: site.commune,
      parcelles: site.parcelles.length,
      success: true,
      durationMs,
    };
  } catch (err: unknown) {
    return {
      idtup: site.idtup,
      commune: site.commune,
      parcelles: site.parcelles.length,
      success: false,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

async function main(): Promise<void> {
  console.log(`Pré-chauffe du cache d'enrichissement CCI 92`);
  console.log(`  - API : ${API_URL}`);
  console.log(`  - Sites à traiter : ${CCI92_SITES.length}`);
  console.log(`  - Délai entre appels : ${DELAY_MS}ms`);
  console.log("");

  const results: PrefetchResult[] = [];
  let totalDuration = 0;

  for (let i = 0; i < CCI92_SITES.length; i++) {
    const site = CCI92_SITES[i];
    const progress = `[${i + 1}/${CCI92_SITES.length}]`;
    process.stdout.write(`${progress} ${site.commune.padEnd(15)} ${site.idtup} ... `);

    const result = await prefetchSite(site);
    results.push(result);
    totalDuration += result.durationMs;

    if (result.success) {
      console.log(`OK (${result.durationMs}ms)`);
    } else {
      console.log(`ECHEC (${result.durationMs}ms) - ${result.error}`);
    }

    if (i < CCI92_SITES.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const successes = results.filter((r) => r.success).length;
  const failures = results.length - successes;
  const avgDuration = Math.round(totalDuration / results.length);

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
      .forEach((r) => console.log(`  - ${r.idtup} (${r.commune}) : ${r.error}`));
  }

  // Sortie en erreur uniquement si TOUS les sites ont échoué (= API HS)
  // Échecs partiels (parcelles individuelles invalides) → exit 0 pour ne pas
  // déclencher d'alarme sur le cron quotidien
  if (successes === 0) {
    console.error("");
    console.error("Aucun site n'a été pré-chauffé avec succès — API potentiellement HS.");
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
