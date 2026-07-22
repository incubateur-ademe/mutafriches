/**
 * SCRIPT TEMPORAIRE — Backfill du canal « page partenaire » sur les données historiques.
 *
 * À supprimer (avec son entrée package.json) une fois le backfill joué sur chaque
 * environnement. Le tracking en temps réel est assuré par le code applicatif
 * (integrateur = 'partenaire:<slug>') ; ce script ne sert qu'à rattraper l'existant.
 *
 * Principe : une ligne dont la/les parcelle(s) appartiennent à un site partenaire
 * (table partenaire_sites) et qui n'a pas encore d'intégrateur, enregistrée depuis le
 * site standalone, est réétiquetée integrateur = 'partenaire:<slug>'. Idempotent
 * (une fois l'integrateur posé, la ligne ne matche plus) : rejouable sans risque.
 *
 * ATTENTION — asymétrie prefetch :
 *   - evaluations : signal PROPRE. Le prefetch/seed n'appelle jamais /evaluation/calculer,
 *     donc chaque évaluation d'un site partenaire est un vrai calcul utilisateur.
 *   - enrichissements / sites : signal BRUITÉ. Le prefetch quotidien (réchauffe du cache)
 *     appelle POST /enrichissement depuis le domaine standalone, sans integrateur : ces
 *     lignes sont indistinguables d'une qualif utilisateur et seront donc, elles aussi,
 *     rattachées au partenaire. Le backfill gonfle mécaniquement les qualifs partenaire.
 *     Utiliser SANS_ENRICHISSEMENTS=true pour ne backfiller que les évaluations.
 *
 * Lancer (sur le dist compilé, cf. gotcha Scalingo — jamais ts-node en prod) :
 *   pnpm --filter api build:nest        # si le dist n'est pas à jour
 *   DRY_RUN=true pnpm db:partenaires:backfill-canal    # compte sans écrire
 *   pnpm db:partenaires:backfill-canal                 # applique
 *   PARTENAIRE=scet pnpm db:partenaires:backfill-canal # un seul partenaire
 *   SANS_ENRICHISSEMENTS=true pnpm db:partenaires:backfill-canal  # évaluations seules
 */
import postgres from "postgres";
import { getAppConfig } from "../config";

const DRY_RUN = process.env.DRY_RUN === "true";
const SANS_ENRICHISSEMENTS = process.env.SANS_ENRICHISSEMENTS === "true";
const PARTENAIRE = process.env.PARTENAIRE?.trim() || null;

// Les UPDATE tournent dans une transaction : on type sur le sql transactionnel.
type Sql = postgres.TransactionSql<Record<string, never>>;

// Filtre optionnel sur un slug de partenaire. postgres-js paramètre la valeur (pas d'injection).
function filtreSlug(sql: Sql) {
  return PARTENAIRE ? sql`AND ps.partenaire_slug = ${PARTENAIRE}` : sql``;
}

// enrichissements : mono-parcelle. identifiant_cadastral = un élément de ps.parcelles.
async function backfillEnrichissements(sql: Sql): Promise<number> {
  const res = await sql`
    UPDATE enrichissements e
    SET integrateur = 'partenaire:' || ps.partenaire_slug
    FROM partenaire_sites ps
    WHERE e.integrateur IS NULL
      AND e.source_utilisation = 'SITE_STANDALONE'
      AND ps.parcelles ? e.identifiant_cadastral
      ${filtreSlug(sql)}
  `;
  return res.count;
}

// sites : multi-parcelle. Au moins une parcelle du site appartient à un site partenaire.
async function backfillSites(sql: Sql): Promise<number> {
  const res = await sql`
    UPDATE sites s
    SET integrateur = 'partenaire:' || ps.partenaire_slug
    FROM partenaire_sites ps
    WHERE s.integrateur IS NULL
      AND s.source_utilisation = 'SITE_STANDALONE'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(ps.parcelles) AS p(idu)
        WHERE s.identifiants_cadastraux ? p.idu
      )
      ${filtreSlug(sql)}
  `;
  return res.count;
}

// evaluations : site_id = liste d'IDU jointes par virgule (mono = 1 IDU).
async function backfillEvaluations(sql: Sql): Promise<number> {
  const res = await sql`
    UPDATE evaluations ev
    SET integrateur = 'partenaire:' || ps.partenaire_slug
    FROM partenaire_sites ps
    WHERE ev.integrateur IS NULL
      AND ev.source_utilisation = 'SITE_STANDALONE'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(ps.parcelles) AS p(idu)
        WHERE p.idu = ANY (string_to_array(ev.site_id, ','))
      )
      ${filtreSlug(sql)}
  `;
  return res.count;
}

async function main(): Promise<void> {
  const sql = postgres(getAppConfig().database);

  console.info(`Backfill canal partenaire`);
  console.info(`  - Mode : ${DRY_RUN ? "DRY RUN (aucune écriture)" : "APPLIQUÉ"}`);
  console.info(`  - Partenaire : ${PARTENAIRE ?? "tous"}`);
  console.info(`  - Périmètre : ${SANS_ENRICHISSEMENTS ? "évaluations seules" : "toutes tables"}`);
  console.info("");

  try {
    // Toutes les UPDATE dans une transaction : DRY_RUN => rollback en capturant les comptes.
    await sql.begin(async (tx) => {
      const evaluations = await backfillEvaluations(tx);
      console.info(`  evaluations   : ${evaluations} ligne(s) (signal propre)`);

      let enrichissements = 0;
      let sites = 0;
      if (!SANS_ENRICHISSEMENTS) {
        enrichissements = await backfillEnrichissements(tx);
        sites = await backfillSites(tx);
        console.info(
          `  enrichissements : ${enrichissements} ligne(s) (dont prefetch, cf. en-tête)`,
        );
        console.info(`  sites           : ${sites} ligne(s) (dont prefetch, cf. en-tête)`);
      }

      if (DRY_RUN) {
        // Annule la transaction : les comptes ci-dessus restent affichés à titre indicatif.
        throw new DryRunRollback();
      }
    });
  } catch (error: unknown) {
    if (error instanceof DryRunRollback) {
      console.info("");
      console.info("DRY RUN : transaction annulée, aucune écriture.");
    } else {
      throw error;
    }
  } finally {
    await sql.end();
  }
}

// Sentinelle pour forcer le rollback de la transaction en DRY_RUN.
class DryRunRollback extends Error {}

main()
  .then(() => {
    console.info("");
    console.info("Backfill terminé.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Erreur backfill canal partenaire : ${message}`);
    process.exit(1);
  });
