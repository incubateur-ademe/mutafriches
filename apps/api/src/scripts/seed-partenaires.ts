/**
 * Seed des partenaires et de leurs sites en base (ADR-0021, phase 1).
 *
 * Idempotent : les partenaires sont mis à jour (métadonnées), les sites « seed »
 * sont insérés s'ils n'existent pas (ON CONFLICT DO NOTHING sur (slug, idtup)) —
 * jamais écrasés, pour ne pas perdre un nom édité.
 *
 * Lancer (sur le dist compilé, cf. gotcha Scalingo) :
 *   pnpm db:partenaires:seed
 */
import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import { getAppConfig } from "../config";
import { partenaires } from "../shared/database/schemas/partenaires.schema";
import { partenaireSites } from "../shared/database/schemas/partenaire-sites.schema";
import { PARTENAIRES_META, PARTENAIRES_PREFETCH } from "./partenaires/registry";

async function main(): Promise<void> {
  const client = postgres(getAppConfig().database);
  const db = drizzle(client);

  try {
    for (const [slug, meta] of Object.entries(PARTENAIRES_META)) {
      await db
        .insert(partenaires)
        .values({
          slug,
          nom: meta.nom,
          description: meta.description,
          departement: meta.departement,
        })
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
