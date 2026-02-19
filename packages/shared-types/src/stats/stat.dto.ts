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
  /** Timestamp UTC en millisecondes, debut de periode */
  date: number;
}

export interface StatOutput {
  /** Description concise, utilisee comme legende de graphe */
  description?: string;
  /** Valeurs par periode */
  stats: Stat[];
}
