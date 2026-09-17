import { describe, expect, it } from "vitest";
import { COLONNES_FRICHE_CNIG, type FricheCnig } from "@mutafriches/shared-types";
import { nomFichierExport, versCsv, versGeoJson, type EntreeExportCnig } from "./cnig-serializer";

function friche(surcharge: Partial<FricheCnig> = {}): FricheCnig {
  const base = Object.fromEntries(
    COLONNES_FRICHE_CNIG.map((colonne) => [colonne, null]),
  ) as unknown as FricheCnig;

  return {
    ...base,
    site_id: "49020_49020000AK0118",
    site_nom: "Rue Georges Morel",
    site_type: "inconnu",
    site_identif_date: "2026-03-04",
    site_actu_date: "2026-09-17",
    comm_nom: "Beaucouzé",
    comm_insee: "49020",
    urba_zaer: "non",
    source_nom: "Mutafriches",
    geompoint: "POINT(47.4721 -0.6339)",
    ...surcharge,
  };
}

const entree = (surcharge: Partial<FricheCnig> = {}): EntreeExportCnig => ({
  ligne: friche(surcharge),
  coordonnees: { latitude: 47.4721, longitude: -0.6339 },
});

describe("versCsv", () => {
  it("écrit l'en-tête des 51 colonnes du standard, dans l'ordre", () => {
    const lignes = versCsv([entree()]).replace("﻿", "").split("\r\n");

    expect(lignes[0].split(",")).toEqual([...COLONNES_FRICHE_CNIG]);
  });

  it("préfixe le fichier du BOM UTF-8 attendu par Excel", () => {
    expect(versCsv([entree()]).startsWith("﻿")).toBe(true);
  });

  it("laisse vides les colonnes non renseignées", () => {
    const ligne = versCsv([entree()]).replace("﻿", "").split("\r\n")[1];

    expect(ligne).toContain(",,");
    expect(ligne).not.toContain("null");
  });

  it("échappe les valeurs contenant une virgule ou un guillemet", () => {
    const csv = versCsv([entree({ site_nom: 'Friche "Nord", lot 2' })]);

    expect(csv).toContain('"Friche ""Nord"", lot 2"');
  });

  it("neutralise une valeur interprétable comme une formule par un tableur", () => {
    const csv = versCsv([entree({ site_nom: "=1+1" })]);

    expect(csv).toContain("'=1+1");
  });

  it("n'ajoute les colonnes Mutafriches que sur demande", () => {
    const sans = versCsv([entree()]).split("\r\n")[0];
    const avec = versCsv([{ ...entree(), ligne: { ...friche(), mf_fiabilite: 8.5 } }], true).split(
      "\r\n",
    )[0];

    expect(sans).not.toContain("mf_fiabilite");
    expect(avec).toContain("mf_fiabilite");
  });

  it("produit un fichier avec le seul en-tête quand aucun site n'est exportable", () => {
    const lignes = versCsv([]).replace("﻿", "").trimEnd().split("\r\n");

    expect(lignes).toHaveLength(1);
  });
});

describe("versGeoJson", () => {
  it("produit une FeatureCollection nommée", () => {
    const geojson = JSON.parse(versGeoJson([entree()], "friches-cci-92")) as {
      type: string;
      name: string;
      features: unknown[];
    };

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.name).toBe("friches-cci-92");
    expect(geojson.features).toHaveLength(1);
  });

  it("utilise l'emprise surfacique quand elle est connue", () => {
    const avecEmprise: EntreeExportCnig = {
      ...entree(),
      geometrie: {
        type: "Polygon",
        coordinates: [
          [
            [-0.63, 47.47],
            [-0.62, 47.48],
            [-0.61, 47.47],
            [-0.63, 47.47],
          ],
        ],
      },
    };

    const geojson = JSON.parse(versGeoJson([avecEmprise], "friches")) as {
      features: { geometry: { type: string } }[];
    };

    expect(geojson.features[0].geometry.type).toBe("Polygon");
  });

  it("se rabat sur le centroïde en [longitude, latitude] (RFC 7946)", () => {
    const geojson = JSON.parse(versGeoJson([entree()], "friches")) as {
      features: { geometry: { type: string; coordinates: number[] } }[];
    };

    expect(geojson.features[0].geometry).toEqual({
      type: "Point",
      coordinates: [-0.6339, 47.4721],
    });
  });

  it("n'expose pas les géométries WKT en doublon dans les propriétés", () => {
    const geojson = JSON.parse(versGeoJson([entree()], "friches")) as {
      features: { properties: Record<string, unknown> }[];
    };

    expect(geojson.features[0].properties).not.toHaveProperty("geompoint");
    expect(geojson.features[0].properties).not.toHaveProperty("geomsurf");
    expect(geojson.features[0].properties.site_id).toBe("49020_49020000AK0118");
  });
});

describe("nomFichierExport", () => {
  const date = new Date("2026-09-17T09:00:00Z");

  it("nomme le fichier conforme sans suffixe", () => {
    expect(nomFichierExport("cci-92", "csv", false, date)).toBe("friches-cnig-cci-92-20260917.csv");
  });

  it("distingue le fichier étendu des colonnes Mutafriches", () => {
    expect(nomFichierExport("cci-92", "geojson", true, date)).toBe(
      "friches-cnig-cci-92-20260917-etendu.geojson",
    );
  });
});
