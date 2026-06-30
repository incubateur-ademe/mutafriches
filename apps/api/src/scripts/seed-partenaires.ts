/**
 * Seed des partenaires et de leurs sites en base (ADR-0021, phases 1 et 2).
 *
 * Deux temps, dans un seul script :
 *   1. Upsert des partenaires + sites (idempotent, pur SQL). Les sites « seed » sont
 *      insérés s'ils n'existent pas (ON CONFLICT DO NOTHING) — jamais écrasés.
 *   2. Calcul du nom par défaut (rue la plus proche) pour les sites sans nom_defaut :
 *      enrichissement (centroïde, réchauffe le cache au passage) puis BAN reverse.
 *      Best-effort : nécessite l'API en marche ; tout échec est ignoré et reste à NULL,
 *      un prochain passage le complétera.
 *
 * Lancer (sur le dist compilé, cf. gotcha Scalingo) :
 *   pnpm db:partenaires:seed                      # tous les partenaires
 *   PARTENAIRE=cci-92 pnpm db:partenaires:seed    # un seul partenaire
 */
import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import { and, eq, isNull } from "drizzle-orm";
import type { Coordonnees, EnrichissementOutputDto } from "@mutafriches/shared-types";
import { getAppConfig } from "../config";
import { partenaires } from "../shared/database/schemas/partenaires.schema";
import { partenaireSites } from "../shared/database/schemas/partenaire-sites.schema";
import { reverseRueProche } from "../partenaires/ban-reverse.util";
import { PARTENAIRES_META, PARTENAIRES_PREFETCH } from "./partenaires/registry";

const { apiUrl: API_URL, partenairesPrefetchDelayMs: DELAY_MS } = getAppConfig().scripts;
const FILTRE = getAppConfig().scripts.partenaireFiltre;
const SEED_ORIGIN = "https://mutafriches.beta.gouv.fr";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Centroïde d'un site via l'enrichissement (réchauffe aussi le cache serveur).
async function getCentroide(parcelles: string[]): Promise<Coordonnees | null> {
  const body = parcelles.length === 1 ? { identifiant: parcelles[0] } : { identifiants: parcelles };
  const res = await fetch(`${API_URL}/enrichissement?acceptDegradedCache=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SEED_ORIGIN },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as EnrichissementOutputDto;
  return data.coordonnees ?? null;
}

async function upsertPartenaires(db: ReturnType<typeof drizzle>, slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    const meta = PARTENAIRES_META[slug];
    await db
      .insert(partenaires)
      .values({ slug, nom: meta.nom, description: meta.description, departement: meta.departement })
      .onConflictDoUpdate({
        target: partenaires.slug,
        set: {
          nom: meta.nom,
          description: meta.description,
          departement: meta.departement,
          updatedAt: new Date(),
        },
      });

    const sites = PARTENAIRES_PREFETCH[slug] ?? [];
    for (const site of sites) {
      await db
        .insert(partenaireSites)
        .values({
          id: uuidv4(),
          partenaireSlug: slug,
          idtup: site.idtup,
          parcelles: site.parcelles,
          commune: site.commune,
          origine: "seed",
        })
        .onConflictDoNothing();
    }
    console.info(`Partenaire ${slug} : ${sites.length} sites traités`);
  }
}

// Renseigne nom_defaut pour les sites qui n'en ont pas encore (best-effort).
async function backfillNomsDefaut(db: ReturnType<typeof drizzle>, slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    const sites = await db
      .select()
      .from(partenaireSites)
      .where(and(eq(partenaireSites.partenaireSlug, slug), isNull(partenaireSites.nomDefaut)));

    if (sites.length > 0) {
      console.info(`Partenaire ${slug} : calcul des noms par défaut (${sites.length} sites)...`);
    }

    let nommes = 0;
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      let rue: string | null = null;
      try {
        const coord = await getCentroide(site.parcelles as string[]);
        if (coord) {
          rue = await reverseRueProche(coord.latitude, coord.longitude);
          if (rue) {
            await db
              .update(partenaireSites)
              .set({ nomDefaut: rue })
              .where(eq(partenaireSites.id, site.id));
            nommes++;
          }
        }
      } catch {
        // Best-effort : on laisse nom_defaut à NULL, un prochain passage réessaiera.
      }
      console.info(
        `  [${i + 1}/${sites.length}] ${site.idtup} (${site.commune}) -> ${rue ?? "(non trouvé)"}`,
      );
      await sleep(DELAY_MS);
    }
    if (sites.length > 0) {
      console.info(`Partenaire ${slug} : ${nommes}/${sites.length} noms par défaut renseignés`);
    }
  }
}

async function main(): Promise<void> {
  const client = postgres(getAppConfig().database);
  const db = drizzle(client);
  const slugs = FILTRE ? [FILTRE] : Object.keys(PARTENAIRES_META);

  try {
    if (FILTRE && !PARTENAIRES_META[FILTRE]) {
      console.error(
        `Partenaire inconnu : "${FILTRE}". Slugs : ${Object.keys(PARTENAIRES_META).join(", ")}`,
      );
      process.exit(1);
    }
    await upsertPartenaires(db, slugs);
    await backfillNomsDefaut(db, slugs);
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    console.info("Seed des partenaires terminé");
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Erreur seed partenaires : ${message}`);
    process.exit(1);
  });
