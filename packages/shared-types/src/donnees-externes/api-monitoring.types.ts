/**
 * Statut d'une API externe à un instant donné, basé sur un simple ping HTTP.
 *
 * - "up"   : l'API a répondu rapidement (< 2 s)
 * - "slow" : l'API a répondu mais lentement (≥ 2 s)
 * - "down" : timeout, erreur réseau ou code HTTP d'erreur (4xx / 5xx)
 */
export type ApiHealthStatus = "up" | "slow" | "down";

/**
 * Résultat de monitoring pour une API externe (un adapter d'enrichissement).
 */
export interface ApiHealthItem {
  /** Identifiant stable pour l'UI (ex: "georisques-rga") */
  key: string;
  /** Libellé affiché (ex: "GéoRisques — RGA") */
  name: string;
  /** Catégorie pour le regroupement visuel (ex: "Risques") */
  category: string;
  /** Description courte de ce que l'API fournit */
  description: string;
  /** URL publique de documentation / portail data.gouv */
  docUrl: string;
  /** Chemin relatif au repo du fichier de l'adapter (pour lien GitHub) */
  adapterFile: string;
  /** URL de base de l'API */
  baseUrl: string;
  /** URL exacte utilisée pour le health-check */
  healthCheckUrl: string;
  /** Statut résultant du check */
  status: ApiHealthStatus;
  /** Code HTTP reçu (null si timeout ou erreur réseau) */
  httpStatus: number | null;
  /** Temps de réponse en millisecondes (null si échec total) */
  responseTimeMs: number | null;
  /** Message d'erreur synthétique (null si OK) */
  error: string | null;
}

/**
 * Snapshot complet d'un cycle de health-check, stocké dans
 * `api_health_snapshots.data` et retourné par GET /api/donnees-externes/apis.
 */
export interface ApiMonitoringSnapshot {
  /** Date d'exécution du cycle (ISO8601, null si aucun check n'a encore été fait) */
  checkedAt: string | null;
  /** Résultat par API */
  apis: ApiHealthItem[];
  /** Comptage agrégé par statut */
  summary: {
    up: number;
    slow: number;
    down: number;
  };
}
