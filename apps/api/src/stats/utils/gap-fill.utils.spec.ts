import { describe, it, expect, vi, afterEach } from "vitest";
import { fillGaps } from "./gap-fill.utils";
import type { Stat } from "@mutafriches/shared-types";

describe("fillGaps", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retourne un tableau vide sans since et sans données", () => {
    const result = fillGaps([], null, "month");
    expect(result).toEqual([]);
  });

  it("comble les mois manquants avec 0", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    const stats: Stat[] = [
      { value: 5, date: new Date("2025-01-01T00:00:00Z").getTime() },
      { value: 3, date: new Date("2025-03-01T00:00:00Z").getTime() },
      { value: 8, date: new Date("2025-06-01T00:00:00Z").getTime() },
    ];

    const result = fillGaps(stats, null, "month");

    expect(result).toHaveLength(6); // jan, fév, mar, avr, mai, jun
    expect(result[0]).toEqual({
      value: 5,
      date: new Date("2025-01-01T00:00:00Z").getTime(),
    });
    expect(result[1]).toEqual({
      value: 0,
      date: new Date("2025-02-01T00:00:00Z").getTime(),
    });
    expect(result[2]).toEqual({
      value: 3,
      date: new Date("2025-03-01T00:00:00Z").getTime(),
    });
    expect(result[3]).toEqual({
      value: 0,
      date: new Date("2025-04-01T00:00:00Z").getTime(),
    });
    expect(result[4]).toEqual({
      value: 0,
      date: new Date("2025-05-01T00:00:00Z").getTime(),
    });
    expect(result[5]).toEqual({
      value: 8,
      date: new Date("2025-06-01T00:00:00Z").getTime(),
    });
  });

  it("commence à since quand fourni, même sans données", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

    const since = new Date("2025-01-01T00:00:00Z");
    const result = fillGaps([], since, "month");

    expect(result).toHaveLength(3); // jan, fév, mar
    expect(result.every((s) => s.value === 0)).toBe(true);
    expect(result[0].date).toBe(new Date("2025-01-01T00:00:00Z").getTime());
  });

  it("comble les jours manquants", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-05T12:00:00Z"));

    const since = new Date("2025-06-01T00:00:00Z");
    const stats: Stat[] = [
      { value: 2, date: new Date("2025-06-01T00:00:00Z").getTime() },
      { value: 4, date: new Date("2025-06-03T00:00:00Z").getTime() },
    ];

    const result = fillGaps(stats, since, "day");

    expect(result).toHaveLength(5); // 1, 2, 3, 4, 5
    expect(result[0].value).toBe(2);
    expect(result[1].value).toBe(0);
    expect(result[2].value).toBe(4);
    expect(result[3].value).toBe(0);
    expect(result[4].value).toBe(0);
  });

  it("comble les semaines manquantes (lundi ISO)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-25T12:00:00Z"));

    const since = new Date("2025-06-02T00:00:00Z"); // lundi
    const stats: Stat[] = [
      { value: 10, date: new Date("2025-06-02T00:00:00Z").getTime() },
      { value: 7, date: new Date("2025-06-16T00:00:00Z").getTime() },
    ];

    const result = fillGaps(stats, since, "week");

    // Semaines : 2 juin, 9 juin, 16 juin, 23 juin
    expect(result).toHaveLength(4);
    expect(result[0].value).toBe(10);
    expect(result[1].value).toBe(0); // 9 juin
    expect(result[2].value).toBe(7); // 16 juin
    expect(result[3].value).toBe(0); // 23 juin
  });

  it("comble les années manquantes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    const stats: Stat[] = [
      { value: 100, date: new Date("2023-01-01T00:00:00Z").getTime() },
      { value: 200, date: new Date("2025-01-01T00:00:00Z").getTime() },
    ];

    const result = fillGaps(stats, null, "year");

    expect(result).toHaveLength(3); // 2023, 2024, 2025
    expect(result[0].value).toBe(100);
    expect(result[1].value).toBe(0); // 2024
    expect(result[2].value).toBe(200);
  });
});
