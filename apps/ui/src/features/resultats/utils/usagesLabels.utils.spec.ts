import { describe, expect, it } from "vitest";
import { UsageResultat, UsageType } from "@mutafriches/shared-types";
import { BADGE_EXCLU, getResultBadgeConfig, getUsagesPodium } from "./usagesLabels.utils";

const resultat = (usage: UsageType, rang: number, exclu = false): UsageResultat => ({
  usage,
  rang,
  indiceMutabilite: 80 - rang,
  exclu,
});

describe("getResultBadgeConfig", () => {
  it("affiche le badge Exclu quel que soit l'indice", () => {
    expect(getResultBadgeConfig({ indiceMutabilite: 82, exclu: true })).toBe(BADGE_EXCLU);
  });

  it("garde le badge de potentiel pour un usage non exclu", () => {
    expect(getResultBadgeConfig({ indiceMutabilite: 82, exclu: false }).label).toBe("EXCELLENT");
    expect(getResultBadgeConfig({ indiceMutabilite: 82 }).label).toBe("EXCELLENT");
  });
});

describe("getUsagesPodium", () => {
  it("ne retient que les trois premiers usages non exclus", () => {
    const resultats = [
      resultat(UsageType.RENATURATION, 1),
      resultat(UsageType.PHOTOVOLTAIQUE, 2, true),
      resultat(UsageType.CULTURE, 3),
      resultat(UsageType.RESIDENTIEL, 4),
      resultat(UsageType.EQUIPEMENTS, 5),
    ];

    expect(getUsagesPodium(resultats).map((r) => r.usage)).toEqual([
      UsageType.RENATURATION,
      UsageType.CULTURE,
      UsageType.RESIDENTIEL,
    ]);
  });
});
