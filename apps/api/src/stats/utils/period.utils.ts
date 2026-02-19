import type { Periodicity } from "@mutafriches/shared-types";

/** Périodicités valides pour DATE_TRUNC PostgreSQL */
const VALID_PERIODICITIES: Periodicity[] = ["day", "week", "month", "year"];

/** Vérifie qu'une chaîne est une périodicité valide */
export function isValidPeriodicity(value: string): value is Periodicity {
  return VALID_PERIODICITIES.includes(value as Periodicity);
}

/**
 * Tronque une date au début de sa période (UTC).
 * Retourne une nouvelle Date sans muter l'originale.
 */
export function truncateDate(date: Date, periodicity: Periodicity): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  switch (periodicity) {
    case "day":
      break;
    case "week": {
      // Lundi = début de semaine (ISO)
      const dayOfWeek = d.getUTCDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      d.setUTCDate(d.getUTCDate() - diff);
      break;
    }
    case "month":
      d.setUTCDate(1);
      break;
    case "year":
      d.setUTCMonth(0, 1);
      break;
  }

  return d;
}

/**
 * Avance une date au début de la période suivante (mutation in-place).
 */
export function advancePeriod(date: Date, periodicity: Periodicity): void {
  switch (periodicity) {
    case "day":
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case "week":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "month":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case "year":
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }
}

/**
 * Calcule la date de début à partir d'un nombre de périodes à remonter.
 * Retourne une date tronquée au début de la période correspondante.
 */
export function computeSinceDate(count: number, periodicity: Periodicity): Date {
  const now = new Date();

  switch (periodicity) {
    case "day":
      now.setUTCDate(now.getUTCDate() - count);
      break;
    case "week":
      now.setUTCDate(now.getUTCDate() - count * 7);
      break;
    case "month":
      now.setUTCMonth(now.getUTCMonth() - count);
      break;
    case "year":
      now.setUTCFullYear(now.getUTCFullYear() - count);
      break;
  }

  return truncateDate(now, periodicity);
}

/**
 * Calcule le TTL du cache en secondes (jusqu'à la fin de la période courante).
 */
export function computeCacheTtl(periodicity: Periodicity): number {
  const now = new Date();
  const endOfPeriod = new Date(now);

  switch (periodicity) {
    case "day":
      endOfPeriod.setUTCDate(endOfPeriod.getUTCDate() + 1);
      endOfPeriod.setUTCHours(0, 0, 0, 0);
      break;
    case "week": {
      const dayOfWeek = endOfPeriod.getUTCDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      endOfPeriod.setUTCDate(endOfPeriod.getUTCDate() + daysUntilMonday);
      endOfPeriod.setUTCHours(0, 0, 0, 0);
      break;
    }
    case "month":
      endOfPeriod.setUTCMonth(endOfPeriod.getUTCMonth() + 1, 1);
      endOfPeriod.setUTCHours(0, 0, 0, 0);
      break;
    case "year":
      endOfPeriod.setUTCFullYear(endOfPeriod.getUTCFullYear() + 1, 0, 1);
      endOfPeriod.setUTCHours(0, 0, 0, 0);
      break;
  }

  return Math.max(0, Math.floor((endOfPeriod.getTime() - now.getTime()) / 1000));
}
