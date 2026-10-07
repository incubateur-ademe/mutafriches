import { describe, expect, it } from "vitest";
import { MIN_ZAE_ATTENDUES, validerCollection } from "./zae.format";

const carre = [
  [
    [2.1, 47.1],
    [2.2, 47.1],
    [2.2, 47.2],
    [2.1, 47.1],
  ],
];

function collection(total = MIN_ZAE_ATTENDUES, surcharge: Record<number, unknown> = {}) {
  const features = Array.from({ length: total }, (_, i) =>
    i in surcharge
      ? surcharge[i]
      : {
          type: "Feature",
          properties: { site_id: `75056_SITE-ECO_${String(i).padStart(7, "0")}` },
          geometry: { type: "Polygon", coordinates: carre },
        },
  );
  return { type: "FeatureCollection", features };
}

describe("validerCollection", () => {
  it("ne garde que l'identifiant, trié pour une sortie stable", () => {
    const entree = collection();
    entree.features.reverse();

    const ids = validerCollection(entree).features.map((f) => f.properties.id);

    expect(ids[0]).toBe("75056_SITE-ECO_0000000");
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
  });

  it("relit le fichier commité (propriété id)", () => {
    const relu = validerCollection(validerCollection(collection()));
    expect(relu.features).toHaveLength(MIN_ZAE_ATTENDUES);
  });

  it("refuse un fichier tronqué", () => {
    expect(() => validerCollection(collection(100))).toThrow(/Fichier suspect/);
  });

  it("refuse une géométrie non surfacique", () => {
    const point = {
      type: "Feature",
      properties: { site_id: "X" },
      geometry: { type: "Point", coordinates: [2, 47] },
    };
    expect(() => validerCollection(collection(MIN_ZAE_ATTENDUES, { 5: point }))).toThrow(
      /non surfacique/,
    );
  });

  it("refuse un identifiant manquant", () => {
    const sansId = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: carre },
    };
    expect(() => validerCollection(collection(MIN_ZAE_ATTENDUES, { 5: sansId }))).toThrow(
      /identifiant manquant/,
    );
  });

  it("refuse les identifiants en double", () => {
    const doublon = {
      type: "Feature",
      properties: { site_id: "75056_SITE-ECO_0000000" },
      geometry: { type: "Polygon", coordinates: carre },
    };
    expect(() => validerCollection(collection(MIN_ZAE_ATTENDUES, { 5: doublon }))).toThrow(
      /en double/,
    );
  });

  it("refuse un fichier sans features", () => {
    expect(() => validerCollection({})).toThrow(/features absent/);
  });
});
