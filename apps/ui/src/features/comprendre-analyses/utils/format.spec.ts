import { describe, expect, it } from "vitest";
import { formatEvolution, formatPoids, formatScore } from "./format";

describe("format (Comprendre les analyses)", () => {
  it("signe les scores, sauf le neutre", () => {
    expect([2, 1, 0.5, -1, -2].map(formatScore)).toEqual(["+2", "+1", "0,5", "−1", "−2"]);
  });

  it("formate le coefficient en français", () => {
    expect(formatPoids(0.5)).toBe("0,5");
    expect(formatPoids(2)).toBe("2");
  });

  it("décrit l'évolution d'un critère", () => {
    expect(formatEvolution({ versionAjout: "v1.1", versionsModification: [] })).toBe("v1.1");
    expect(formatEvolution({ versionAjout: "v1.18", versionsModification: ["v1.19"] })).toBe(
      "v1.18 ; modif. v1.19",
    );
  });
});
