import { describe, expect, it } from "vitest";
import { calculerSuccesseurs, Surface, unir } from "./successeurs";

// Rectangle en degrés, proche de l'équateur (aires quasi proportionnelles).
function rect(id: string, x0: number, y0: number, x1: number, y1: number): Surface {
  return {
    type: "Feature",
    properties: { id },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
          [x0, y0],
        ],
      ],
    },
  };
}

describe("calculerSuccesseurs", () => {
  // Site historique : A (conservée) + B (disparue), côte à côte.
  const a = rect("A", 0, 0, 0.001, 0.001);
  const b = rect("B", 0.001, 0, 0.002, 0.001);
  const emprise = unir([a, b]);

  it("retient les parcelles issues de la division de la parcelle disparue", () => {
    const b1 = rect("B1", 0.001, 0, 0.0015, 0.001);
    const b2 = rect("B2", 0.0015, 0, 0.002, 0.001);
    const res = calculerSuccesseurs([b], emprise, [a, b1, b2], new Set(["A"]));

    expect(res.successeurs.map((s) => s.id)).toEqual(["B1", "B2"]);
    expect(res.ecartes).toEqual([]);
    expect(res.couverture).toBeCloseTo(1, 3);
  });

  it("écarte une parcelle fusionnée qui déborde surtout hors du site", () => {
    // B absorbée dans une grande parcelle voisine, 1/4 seulement dans le site
    const fusion = rect("F", 0.001, 0, 0.005, 0.001);
    const res = calculerSuccesseurs([b], emprise, [a, fusion], new Set(["A"]));

    expect(res.successeurs).toEqual([]);
    expect(res.ecartes[0].id).toBe("F");
    expect(res.ecartes[0].partDansSite).toBeCloseTo(0.25, 2);
    expect(res.couverture).toBe(0);
  });

  it("ignore un simple contact de bord", () => {
    const voisine = rect("V", 0.002, 0, 0.003, 0.001);
    const res = calculerSuccesseurs([b], emprise, [a, voisine], new Set(["A"]));

    expect(res.successeurs).toEqual([]);
    expect(res.ecartes).toEqual([]);
  });
});
