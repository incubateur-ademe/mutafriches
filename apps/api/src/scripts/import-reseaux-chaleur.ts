/* eslint-disable no-console */
/**
 * Script d'import du référentiel des réseaux de chaleur urbains en base.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:reseaux-chaleur:import
 *
 * Source : API France Chaleur Urbaine (ministère de la Transition écologique), endpoint
 * public `GET /v1/networks` — licence Ouverte 2.0.
 *   https://www.data.gouv.fr/dataservices/api-france-chaleur-urbaine
 *
 * Le tracé est TÉLÉCHARGÉ à l'exécution et non commité : le GeoJSON pèse 63 Mo (2 millions
 * de segments), soit dix fois le plus gros référentiel du dépôt. L'endpoint est public,
 * stable et sans authentification, ce qui rend le fichier inutile à versionner.
 *
 * Pourquoi un référentiel local plutôt que l'appel live à `/v1/eligibility` : cet endpoint
 * mesure la distance sur une géométrie partielle pour une partie des réseaux (cf. ADR-0037).
 *
 * Prérequis :
 *   - La migration 0032_raw_reseaux_chaleur.sql doit avoir été exécutée.
 *   - PostGIS doit être activé sur la base.
 *
 * À rejouer à chaque évolution du référentiel FCU (les réseaux en construction évoluent en
 * continu) : une à deux fois par an, ou sur signalement d'un écart.
 *
 * Attention : l'endpoint source est limité à 2 requêtes par minute. En cas d'échec, attendre
 * une minute avant de relancer.
 *
 * Comportement :
 *   - Télécharge le GeoJSON (WGS84)
 *   - Valide l'intégralité de la réponse AVANT de vider la table (une réponse tronquée ne
 *     doit jamais écraser un référentiel valide)
 *   - Truncate raw_reseaux_chaleur puis insère par batch (idempotent)
 *   - Normalise les géométries en MultiLineString valides (ST_Multi + ST_MakeValid)
 *   - Log la progression dans raw_imports_log
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { sql, SQL } from "drizzle-orm";
import postgres from "postgres";
import { getAppConfig } from "../config";

const SOURCE_URL = "https://france-chaleur-urbaine.beta.gouv.fr/api/v1/networks";
const BATCH_SIZE = 25;
const DATASET_NAME = "reseaux-chaleur";
const TIMEOUT_MS = 180_000;

/**
 * Plancher de sécurité : le millésime 2026 compte 1 307 réseaux. En dessous de 1 000, la
 * réponse est tronquée ou le périmètre a fondu — on refuse d'écraser le référentiel.
 */
const MIN_RESEAUX_ATTENDUS = 1000;

interface ReseauApi {
  "Identifiant reseau"?: string;
  nom_reseau?: string;
  Gestionnaire?: string;
  geom?: { type?: string; coordinates?: unknown } | null;
}

interface ReseauRow {
  identifiantReseau: string | null;
  nom: string | null;
  gestionnaire: string | null;
  traceComplet: boolean;
  geometrie: string;
}

function tronquer(valeur: unknown, longueur: number): string | null {
  const texte = typeof valeur === "string" ? valeur.trim() : "";
  if (texte === "") return null;
  return texte.length > longueur ? texte.slice(0, longueur) : texte;
}

/** Convertit un réseau de l'API en ligne prête à insérer, ou null s'il n'a pas de géométrie. */
function versLigne(reseau: ReseauApi, index: number): ReseauRow | null {
  const geom = reseau.geom;
  if (!geom || !geom.coordinates) return null;

  // 18 % des réseaux ne sont publiés que par un point : on les garde, en les marquant,
  // car la distance à un point surestime la distance au réseau réel.
  const lineaires = geom.type === "LineString" || geom.type === "MultiLineString";
  const ponctuels = geom.type === "Point" || geom.type === "MultiPoint";
  if (!lineaires && !ponctuels) {
    throw new Error(`Réseau ${index} : géométrie inattendue (${String(geom.type)})`);
  }

  return {
    identifiantReseau: tronquer(reseau["Identifiant reseau"], 20),
    nom: tronquer(reseau.nom_reseau, 255),
    gestionnaire: tronquer(reseau.Gestionnaire, 255),
    traceComplet: lineaires,
    geometrie: JSON.stringify(geom),
  };
}

/**
 * Découpe un flux JSON représentant un tableau d'objets, et émet chaque objet de premier
 * niveau séparément.
 *
 * Indispensable ici : `response.json()` sur les 63 Mo du référentiel construit d'un coup les
 * 2,3 millions de points en objets JavaScript, soit ~580 Mo de RSS — au-delà de ce qu'encaisse
 * un conteneur one-off Scalingo, qui tue le process (exit 137). En parsant réseau par réseau,
 * seul l'objet courant vit en mémoire, et l'on n'en conserve que la géométrie sérialisée.
 */
async function* decouperTableauJson(flux: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const decodeur = new TextDecoder();
  const lecteur = flux.getReader();

  let tampon = "";
  let position = 0;
  let profondeur = 0;
  let debutObjet = -1;
  let dansChaine = false;
  let echappement = false;

  while (true) {
    const { done, value } = await lecteur.read();
    if (done) break;
    tampon += decodeur.decode(value, { stream: true });

    let consomme = 0;
    for (let i = position; i < tampon.length; i++) {
      const caractere = tampon[i];

      if (dansChaine) {
        if (echappement) echappement = false;
        else if (caractere === "\\") echappement = true;
        else if (caractere === '"') dansChaine = false;
        continue;
      }

      if (caractere === '"') dansChaine = true;
      else if (caractere === "{") {
        if (profondeur === 0) debutObjet = i;
        profondeur++;
      } else if (caractere === "}") {
        profondeur--;
        if (profondeur === 0 && debutObjet !== -1) {
          yield tampon.slice(debutObjet, i + 1);
          consomme = i + 1;
          debutObjet = -1;
        }
      }
    }

    // Un seul découpage par chunk : re-slicer à chaque objet rendait le parcours quadratique.
    if (consomme > 0) {
      tampon = tampon.slice(consomme);
      if (debutObjet !== -1) debutObjet -= consomme;
      position = tampon.length;
    } else {
      position = tampon.length;
    }
  }
}

/**
 * Parcourt le référentiel en flux et appelle `traiter` sur chaque lot de lignes prêtes.
 *
 * Rien n'est accumulé : seul le lot courant vit en mémoire. Retourne le nombre de réseaux
 * reçus et le nombre de lignes exploitables.
 */
async function parcourirReferentiel(
  traiter: (lot: ReseauRow[]) => Promise<void>,
): Promise<{ recus: number; retenus: number }> {
  const reponse = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (reponse.status === 429) {
    throw new Error(
      "France Chaleur Urbaine limite /v1/networks à 2 requêtes par minute. " +
        "Attendre une minute avant de relancer l'import.",
    );
  }
  if (!reponse.ok) {
    throw new Error(`Téléchargement échoué : HTTP ${reponse.status} ${reponse.statusText}`);
  }
  if (!reponse.body) {
    throw new Error("Réponse sans corps : impossible de lire le référentiel en flux");
  }

  let recus = 0;
  let retenus = 0;
  let lot: ReseauRow[] = [];

  for await (const objet of decouperTableauJson(reponse.body)) {
    const reseau = JSON.parse(objet) as ReseauApi;
    recus++;

    const ligne = versLigne(reseau, recus - 1);
    if (!ligne) continue;

    lot.push(ligne);
    retenus++;

    if (lot.length >= BATCH_SIZE) {
      await traiter(lot);
      lot = [];
    }
  }

  if (lot.length > 0) await traiter(lot);

  if (recus === 0) {
    throw new Error("Réponse inattendue : aucun réseau lu dans le flux");
  }

  return { recus, retenus };
}

async function insererBatch(db: ReturnType<typeof drizzle>, batch: ReseauRow[]): Promise<void> {
  if (batch.length === 0) return;

  const valeurs: SQL[] = batch.map(
    (row) => sql`(
      ${row.identifiantReseau},
      ${row.nom},
      ${row.gestionnaire},
      ${row.traceComplet},
      ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${row.geometrie}), 4326))
    )`,
  );

  await db.execute(sql`
    INSERT INTO raw_reseaux_chaleur (identifiant_reseau, nom, gestionnaire, trace_complet, geom)
    VALUES ${sql.join(valeurs, sql`, `)}
  `);
}

async function importReseauxChaleur(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import des réseaux de chaleur urbains en base de données");
  console.log("=".repeat(60));
  console.log(`Source : ${SOURCE_URL}`);
  console.log("-".repeat(60));

  const client = postgres(getAppConfig().database);
  const db = drizzle(client);
  const debut = Date.now();
  let importes = 0;
  let recus = 0;

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path)
    VALUES (${DATASET_NAME}, ${SOURCE_URL})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import créé : id=${logId}`);

  try {
    console.log("\nTéléchargement du référentiel en flux (environ 63 Mo)...");

    // TRUNCATE et INSERT dans une seule transaction : le référentiel existant n'est remplacé
    // qu'au COMMIT. Une réponse tronquée, une géométrie invalide ou une coupure réseau
    // déclenchent un ROLLBACK et laissent la table intacte — ce que la validation préalable
    // assurait avant, mais sans accumuler les 63 Mo en mémoire.
    await db.transaction(async (tx) => {
      await tx.execute(sql`TRUNCATE TABLE raw_reseaux_chaleur RESTART IDENTITY`);

      const compteurs = await parcourirReferentiel(async (lot) => {
        await insererBatch(tx as unknown as ReturnType<typeof drizzle>, lot);
        importes += lot.length;
        process.stdout.write(`\rProgression : ${importes} réseaux importés`);
      });
      process.stdout.write("\n");

      recus = compteurs.recus;

      if (recus < MIN_RESEAUX_ATTENDUS) {
        throw new Error(
          `Réponse suspecte : ${recus} réseaux reçus, minimum attendu ${MIN_RESEAUX_ATTENDUS}. ` +
            "Import annulé, le référentiel existant est conservé.",
        );
      }
    });

    const sansGeometrie = recus - importes;
    const duree = (Date.now() - debut) / 1000;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${importes},
          rows_total = ${recus}
      WHERE id = ${logId}
    `);

    const statsResult = await db.execute<{
      total: string;
      avec_identifiant: string;
      sans_trace: string;
      geom_invalides: string;
      longueur_km: number;
    }>(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(identifiant_reseau) AS avec_identifiant,
        COUNT(*) FILTER (WHERE NOT trace_complet) AS sans_trace,
        COUNT(*) FILTER (WHERE geom IS NULL OR NOT ST_IsValid(geom)) AS geom_invalides,
        ROUND((SUM(ST_Length(geom::geography)) / 1000)::numeric) AS longueur_km
      FROM raw_reseaux_chaleur
    `);
    const stats = (
      statsResult as unknown as Array<{
        total: string;
        avec_identifiant: string;
        sans_trace: string;
        geom_invalides: string;
        longueur_km: number;
      }>
    )[0];

    console.log("-".repeat(60));
    console.log("TERMINÉ !");
    console.log("-".repeat(60));
    console.log(`Réseaux importés : ${stats.total}`);
    console.log(`Avec identifiant national : ${stats.avec_identifiant}`);
    console.log(`Réseaux réduits à un point (tracé non publié) : ${stats.sans_trace}`);
    console.log(`Réseaux sans aucune géométrie (ignorés) : ${sansGeometrie}`);
    console.log(`Longueur cumulée : ${stats.longueur_km} km`);
    console.log(`Géométries invalides : ${stats.geom_invalides}`);
    console.log(`Durée : ${duree.toFixed(1)}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'failed',
          rows_imported = ${importes},
          rows_total = ${recus},
          error_message = ${message}
      WHERE id = ${logId}
    `);
    throw error;
  } finally {
    await client.end();
    console.log("Connexion base de données fermée");
  }
}

importReseauxChaleur().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur :", message);
  const cause = (error as { cause?: { message?: string } })?.cause;
  if (cause?.message) {
    console.error("  cause :", cause.message);
  }
  process.exit(1);
});
