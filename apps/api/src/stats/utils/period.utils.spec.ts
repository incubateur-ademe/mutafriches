import { describe, it, expect } from "vitest";
import {
  isValidPeriodicity,
  truncateDate,
  advancePeriod,
  computeSinceDate,
  computeCacheTtl,
} from "./period.utils";

describe("isValidPeriodicity", () => {
  it.each(["day", "week", "month", "year"])("retourne true pour '%s'", (value) => {
    expect(isValidPeriodicity(value)).toBe(true);
  });

  it.each(["hour", "minute", "quarter", "", "Day", "MONTH", "invalid"])(
    "retourne false pour '%s'",
    (value) => {
      expect(isValidPeriodicity(value)).toBe(false);
    },
  );
});

describe("truncateDate", () => {
  it("tronque au jour", () => {
    const date = new Date("2025-06-15T14:30:45.123Z");
    const result = truncateDate(date, "day");
    expect(result.toISOString()).toBe("2025-06-15T00:00:00.000Z");
  });

  it("tronque à la semaine (lundi ISO)", () => {
    // 2025-06-15 est un dimanche
    const result = truncateDate(new Date("2025-06-15T14:30:00Z"), "week");
    expect(result.toISOString()).toBe("2025-06-09T00:00:00.000Z");
  });

  it("tronque à la semaine pour un lundi", () => {
    // 2025-06-09 est un lundi
    const result = truncateDate(new Date("2025-06-09T10:00:00Z"), "week");
    expect(result.toISOString()).toBe("2025-06-09T00:00:00.000Z");
  });

  it("tronque à la semaine pour un mercredi", () => {
    // 2025-06-11 est un mercredi
    const result = truncateDate(new Date("2025-06-11T10:00:00Z"), "week");
    expect(result.toISOString()).toBe("2025-06-09T00:00:00.000Z");
  });

  it("tronque au mois", () => {
    const result = truncateDate(new Date("2025-06-15T14:30:00Z"), "month");
    expect(result.toISOString()).toBe("2025-06-01T00:00:00.000Z");
  });

  it("tronque à l'année", () => {
    const result = truncateDate(new Date("2025-06-15T14:30:00Z"), "year");
    expect(result.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("ne mute pas la date originale", () => {
    const original = new Date("2025-06-15T14:30:00Z");
    const originalTime = original.getTime();
    truncateDate(original, "month");
    expect(original.getTime()).toBe(originalTime);
  });
});

describe("advancePeriod", () => {
  it("avance d'un jour", () => {
    const date = new Date("2025-06-15T00:00:00Z");
    advancePeriod(date, "day");
    expect(date.toISOString()).toBe("2025-06-16T00:00:00.000Z");
  });

  it("avance d'une semaine", () => {
    const date = new Date("2025-06-09T00:00:00Z");
    advancePeriod(date, "week");
    expect(date.toISOString()).toBe("2025-06-16T00:00:00.000Z");
  });

  it("avance d'un mois", () => {
    const date = new Date("2025-06-01T00:00:00Z");
    advancePeriod(date, "month");
    expect(date.toISOString()).toBe("2025-07-01T00:00:00.000Z");
  });

  it("avance d'un mois en fin d'année", () => {
    const date = new Date("2025-12-01T00:00:00Z");
    advancePeriod(date, "month");
    expect(date.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("avance d'un an", () => {
    const date = new Date("2025-01-01T00:00:00Z");
    advancePeriod(date, "year");
    expect(date.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("computeSinceDate", () => {
  it("retourne une date tronquée au début de la période", () => {
    const result = computeSinceDate(3, "month");
    // Doit être le 1er du mois à 00:00:00 UTC
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("recule de 7 jours pour since=7, periodicity=day", () => {
    const now = new Date();
    const expected = new Date(now);
    expected.setUTCDate(expected.getUTCDate() - 7);
    expected.setUTCHours(0, 0, 0, 0);

    const result = computeSinceDate(7, "day");
    expect(result.toISOString()).toBe(expected.toISOString());
  });

  it("recule de 2 semaines pour since=2, periodicity=week", () => {
    const result = computeSinceDate(2, "week");
    // Doit être un lundi à 00:00:00 UTC
    const dayOfWeek = result.getUTCDay();
    expect(dayOfWeek).toBe(1); // lundi
    expect(result.getUTCHours()).toBe(0);
  });

  it("recule de 1 an pour since=1, periodicity=year", () => {
    const result = computeSinceDate(1, "year");
    expect(result.getUTCMonth()).toBe(0);
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCHours()).toBe(0);
  });
});

describe("computeCacheTtl", () => {
  it("retourne un nombre positif", () => {
    const ttl = computeCacheTtl("month");
    expect(ttl).toBeGreaterThan(0);
  });

  it("retourne un TTL plus court pour day que pour year", () => {
    const ttlDay = computeCacheTtl("day");
    const ttlYear = computeCacheTtl("year");
    expect(ttlDay).toBeLessThan(ttlYear);
  });

  it("TTL day est inférieur à 86400 secondes", () => {
    const ttl = computeCacheTtl("day");
    expect(ttl).toBeLessThanOrEqual(86400);
  });

  it("TTL month est inférieur à 31 jours", () => {
    const ttl = computeCacheTtl("month");
    expect(ttl).toBeLessThanOrEqual(31 * 86400);
  });
});
