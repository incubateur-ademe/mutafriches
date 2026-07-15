import { describe, expect, it } from "vitest";
import { lambert93ToWgs84 } from "./lambert";

describe("lambert93ToWgs84", () => {
  it("reprojette un point de Montereau-Fault-Yonne (77)", () => {
    // Point issu de l'inventaire CCPM (SCET), attendu autour de 48.39N / 2.94E.
    const { latitude, longitude } = lambert93ToWgs84(695480.24, 6809874.18);
    expect(latitude).toBeCloseTo(48.386, 2);
    expect(longitude).toBeCloseTo(2.939, 2);
  });

  it("reprojette l'origine Lambert-93 proche du méridien 3°E", () => {
    const { longitude } = lambert93ToWgs84(700000, 6600000);
    expect(longitude).toBeCloseTo(3, 3);
  });
});
