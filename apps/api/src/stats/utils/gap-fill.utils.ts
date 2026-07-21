import type { Periodicity, Stat } from "@mutafriches/shared-types";
import { truncateDate, advancePeriod } from "./period.utils";

/** Point interne avant sérialisation : date en millisecondes UTC (clé de regroupement). */
export interface StatPoint {
  value: number;
  date: number;
}

/**
 * Comble les périodes manquantes avec value: 0 et sérialise les dates en ISO 8601 UTC.
 * Génère toutes les dates de début de période entre `since` (ou la première
 * valeur existante) et maintenant, puis mappe les valeurs existantes.
 * La date de sortie est une chaîne ISO (contrat incubateur, cf. Stat.date).
 */
export function fillGaps(stats: StatPoint[], since: Date | null, periodicity: Periodicity): Stat[] {
  if (stats.length === 0 && !since) return [];

  const now = new Date();
  const start = since ?? (stats.length > 0 ? new Date(stats[0].date) : now);

  // Générer toutes les dates de début de période
  const allPeriods: number[] = [];
  const cursor = truncateDate(new Date(start), periodicity);

  while (cursor <= now) {
    allPeriods.push(cursor.getTime());
    advancePeriod(cursor, periodicity);
  }

  // Index des valeurs existantes
  const valueMap = new Map<number, number>();
  for (const stat of stats) {
    valueMap.set(stat.date, stat.value);
  }

  // Combler les trous et sérialiser la date en ISO 8601 UTC
  return allPeriods.map((date) => ({
    value: valueMap.get(date) ?? 0,
    date: new Date(date).toISOString(),
  }));
}
