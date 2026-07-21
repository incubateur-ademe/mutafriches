export type Periodicity = "day" | "week" | "month" | "year";

export interface StatInput {
  /**
   * Nombre de periodes a remonter.
   * @default Infinity (all time)
   */
  since?: number;

  /**
   * Periodicite de regroupement.
   * @default 'month'
   */
  periodicity?: Periodicity;
}

export interface Stat {
  /** Valeur numerique de la stat pour cette periode */
  value: number;
  /**
   * Debut de periode en chaine ISO 8601 UTC (ex. "2025-09-01T00:00:00.000Z").
   * Format string volontaire : le dashboard incubateur parse les dates via
   * Date.parse pour les chaines, mais interprete un nombre comme un timestamp
   * en SECONDES (x1000) — un nombre en millisecondes produirait des dates hors bornes.
   */
  date: string;
}

export interface StatOutput {
  /** Description concise, utilisee comme legende de graphe */
  description?: string;
  /** Valeurs par periode */
  stats: Stat[];
}
