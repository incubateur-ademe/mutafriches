import { describe, expect, it } from "vitest";
import type { GeometrieParcelle } from "@mutafriches/shared-types";
import { Site } from "./site.entity";

const carre: GeometrieParcelle = {
  type: "Polygon",
  coordinates: [
    [
      [2.31, 48.93],
      [2.311, 48.93],
      [2.311, 48.931],
      [2.31, 48.93],
    ],
  ],
};

describe("Site.geometriesParcelles", () => {
  it("expose la géométrie de chaque parcelle et ignore celles qui n'en ont pas", () => {
    const site = new Site();
    site.parcelles = [
      {
        identifiantParcelle: "92036000L0162",
        codeInsee: "92036",
        commune: "G",
        surface: 10,
        geometrie: carre,
      },
      { identifiantParcelle: "92036000L0163", codeInsee: "92036", commune: "G", surface: 5 },
    ];

    expect(site.geometriesParcelles).toEqual([{ identifiant: "92036000L0162", geometrie: carre }]);
  });
});
