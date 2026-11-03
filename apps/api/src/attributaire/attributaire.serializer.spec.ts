import { describe, it, expect } from "vitest";
import { AVERTISSEMENT_SAISIE_DECLARATIVE } from "@mutafriches/shared-types";
import type { AttributaireSite } from "../shared/database/schemas/attributaire-sites.schema";
import { versGeoJsonAttributaire, versTableAttributaire } from "./attributaire.serializer";

const DATE = new Date("2026-11-03T10:00:00Z");

function ligne(surcharge: Partial<AttributaireSite> = {}): AttributaireSite {
  return {
    cleSite: "77305000AV0499,77305000AV0500",
    identifiantsCadastraux: ["77305000AV0499", "77305000AV0500"],
    nombreParcelles: 2,
    parcellePredominante: "77305000AV0500",
    codeInsee: "77305",
    commune: "Montereau-Fault-Yonne",
    partenaireSlug: "scet",
    partenaireIdtup: "scet-7",
    nom: "Ex-bâtiment ORANGE",
    centroidLatitude: "48.3836000",
    centroidLongitude: "2.9575000",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [
          [2.95, 48.38],
          [2.96, 48.38],
          [2.95, 48.39],
          [2.95, 48.38],
        ],
      ],
    },
    criteresAutomatiques: { surfaceSite: 3415, zonageAbcLogement: null },
    dateEnrichissement: DATE,
    criteresSaisis: { typeProprietaire: "prive" },
    dateSaisie: DATE,
    evaluationId: "eval-interne",
    nombreEvaluations: 2,
    mutabilite: {
      indices: { residentiel: 72.3, industrie: 47 },
      usagePrioritaire: "residentiel" as never,
      usagesExclus: ["photovoltaique" as never],
      fiabilite: { note: 9, niveau: "Très fiable" },
    },
    fiabilite: "9",
    usagePrioritaire: "residentiel",
    versionAlgorithme: "v1.19",
    dateMiseAJour: DATE,
    ...surcharge,
  };
}

describe("versTableAttributaire", () => {
  it("expose la saisie comme déclarative et jamais l'identifiant d'évaluation", () => {
    const table = versTableAttributaire(
      { codeInsee: "77305", commune: "Montereau-Fault-Yonne", lignes: [ligne()] },
      DATE,
    );

    expect(table.avertissement).toBe(AVERTISSEMENT_SAISIE_DECLARATIVE);
    expect(table.nombreSites).toBe(1);
    expect(table.sites[0].saisieDeclarative).toBe(true);
    expect(table.sites[0].centroide).toEqual({ latitude: 48.3836, longitude: 2.9575 });
    expect(JSON.stringify(table)).not.toContain("eval-interne");
    expect(table.sites[0]).not.toHaveProperty("geometrie");
  });

  it("marque un site jamais qualifié", () => {
    const table = versTableAttributaire(
      { codeInsee: "77305", lignes: [ligne({ criteresSaisis: null, dateSaisie: null })] },
      DATE,
    );

    expect(table.sites[0].saisieDeclarative).toBe(false);
    expect(table.sites[0].criteresSaisis).toBeNull();
    expect(table.sites[0].dateSaisie).toBeUndefined();
  });
});

describe("versGeoJsonAttributaire", () => {
  it("met les attributs à plat, une colonne par critère et par usage", () => {
    const collection = versGeoJsonAttributaire({ codeInsee: "77305", lignes: [ligne()] }, DATE);
    const { properties, geometry } = collection.features[0];

    expect(collection.name).toBe("mutafriches-attributaire-77305");
    expect(geometry).toEqual(ligne().geometrie);
    expect(properties.parcelles).toBe("77305000AV0499|77305000AV0500");
    expect(properties.surfaceSite).toBe(3415);
    expect(properties.zonageAbcLogement).toBeNull();
    // Critère absent de la ligne : colonne présente quand même
    expect(properties).toHaveProperty("siteEnZae", null);
    expect(properties.typeProprietaire).toBe("prive");
    expect(properties.presencePollution).toBe("ne-sait-pas");
    expect(properties.indice_residentiel).toBe(72.3);
    expect(properties.indice_culture).toBeNull();
    expect(properties.usages_exclus).toBe("photovoltaique");
    expect(properties.saisie_declarative).toBe(true);
  });

  it("se rabat sur le centroïde sans emprise", () => {
    const collection = versGeoJsonAttributaire(
      { codeInsee: "77305", lignes: [ligne({ geometrie: null })] },
      DATE,
    );

    expect(collection.features[0].geometry).toEqual({
      type: "Point",
      coordinates: [2.9575, 48.3836],
    });
  });
});
