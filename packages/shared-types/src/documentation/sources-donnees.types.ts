import { SourceEnrichissement } from "../enrichissement";

/** Nature d'une source de données : API distante ou référentiel importé en base locale */
export type TypeSourceDonnees = "api-externe" | "referentiel-local";

/**
 * Description d'une source de données externe utilisée pour l'enrichissement
 * automatique des analyses de mutabilité.
 *
 * Source de vérité de la documentation partenaires (page UI, export PDF, doc Markdown).
 * Les critères d'évaluation alimentés (et leur poids) ne sont PAS re-saisis ici : ils sont
 * dérivés du registre autoritaire CRITERES_METADATA via `sourcesEnrichissement`.
 */
export interface SourceDonnees {
  /** Identifiant slug (ancre, clé de rendu) */
  id: string;
  /** Nom lisible de la source (ex : "GéoRisques — risques naturels") */
  nom: string;
  /** Organisme producteur / opérateur (ex : "IGN", "Enedis", "BRGM / MTE") */
  organisme: string;
  /** Nature : API distante interrogée en direct ou référentiel importé en base locale */
  type: TypeSourceDonnees;
  /** URL de documentation publique de la source */
  urlDoc: string;
  /**
   * Valeurs de l'enum SourceEnrichissement regroupées dans ce bloc. Sert à dériver
   * les critères alimentés depuis CRITERES_METADATA (jointure par `source`).
   */
  sourcesEnrichissement: SourceEnrichissement[];
  /** Champs réellement récupérés depuis la source */
  champsRecuperes: string[];
  /** Traitement appliqué dans l'algorithme (seuils, normalisation) — prose courte */
  traitementAlgo: string;
}
