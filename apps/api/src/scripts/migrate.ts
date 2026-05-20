/* eslint-disable no-console */
/**
 * Wrapper de migration Drizzle qui affiche les erreurs SQL completes.
 *
 * Probleme : `drizzle-kit migrate` utilise un spinner TTY qui ecrase les
 * messages d'erreur dans les logs Scalingo, ce qui rend impossible le
 * diagnostic d'un echec de migration en production.
 *
 * Ce script utilise l'API programmatique `drizzle-orm/postgres-js/migrator`
 * et imprime explicitement le code, le message et la query PostgreSQL en
 * cas d'echec.
 *
 * Usage:
 *   pnpm db:migrate:verbose
 */

import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as postgres from "postgres";

interface PgError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  query?: string;
  where?: string;
  schema_name?: string;
  table_name?: string;
  constraint_name?: string;
}

async function main(): Promise<void> {
  const migrationsFolder = path.resolve(__dirname, "../shared/database/migrations");
  console.log("=".repeat(60));
  console.log("Application des migrations Drizzle");
  console.log("=".repeat(60));
  console.log(`Dossier migrations: ${migrationsFolder}`);

  const client = process.env.SCALINGO_POSTGRESQL_URL
    ? postgres(process.env.SCALINGO_POSTGRESQL_URL, {
        max: 1,
        ssl: { rejectUnauthorized: false },
        onnotice: (notice) => console.log(`[NOTICE] ${notice.message}`),
      })
    : postgres({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USER || "mutafriches_user",
        password: process.env.DB_PASSWORD || "mutafriches_password",
        database: process.env.DB_NAME || "mutafriches",
        max: 1,
        onnotice: (notice) => console.log(`[NOTICE] ${notice.message}`),
      });
  console.log(
    process.env.SCALINGO_POSTGRESQL_URL
      ? "Connexion: Scalingo (SCALINGO_POSTGRESQL_URL)"
      : `Connexion: Local sur ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}`,
  );

  const db = drizzle(client);

  try {
    console.log("-".repeat(60));
    await migrate(db, { migrationsFolder });
    console.log("-".repeat(60));
    console.log("Migrations appliquees avec succes.");
    await client.end();
    process.exit(0);
  } catch (err) {
    const pgErr = err as PgError;
    console.error("-".repeat(60));
    console.error("ECHEC DES MIGRATIONS");
    console.error("-".repeat(60));
    console.error(`Message: ${pgErr.message}`);
    if (pgErr.code) console.error(`Code PG: ${pgErr.code}`);
    if (pgErr.detail) console.error(`Detail: ${pgErr.detail}`);
    if (pgErr.hint) console.error(`Hint: ${pgErr.hint}`);
    if (pgErr.position) console.error(`Position: ${pgErr.position}`);
    if (pgErr.schema_name) console.error(`Schema: ${pgErr.schema_name}`);
    if (pgErr.table_name) console.error(`Table: ${pgErr.table_name}`);
    if (pgErr.constraint_name) console.error(`Contrainte: ${pgErr.constraint_name}`);
    if (pgErr.query) console.error(`Query echouee:\n${pgErr.query}`);
    if (pgErr.stack) console.error(`Stack:\n${pgErr.stack}`);
    await client.end();
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("Erreur inattendue:", err);
  process.exit(1);
});
