import type { Periodicity, Stat } from "@mutafriches/shared-types";
import { truncateDate, advancePeriod } from "./period.utils";

/**
 * Comble les périodes manquantes avec value: 0.
 * Génère toutes les dates de début de période entre `since` (ou la première
 * valeur existante) et maintenant, puis mappe les valeurs existantes.
 */
export function fillGaps(stats: Stat[], since: Date | null, periodicity: Periodicity): Stat[] {
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

  // Combler les trous
  return allPeriods.map((date) => ({
    value: valueMap.get(date) ?? 0,
    date,
  }));
}
