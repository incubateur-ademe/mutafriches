import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO Swagger représentant les métadonnées de l'évaluation.
 */
export class MetadataSwaggerDto {
  @ApiProperty({
    description:
      "Enums groupés par catégorie. `enrichissement` = valeurs renvoyées par l'API d'enrichissement. `saisie` = valeurs attendues dans les données complémentaires (les 8 champs saisis manuellement). `usages` = les 7 usages évalués par l'algorithme.",
    example: {
      enrichissement: {
        risqueRetraitGonflementArgile: ["aucun", "faible-ou-moyen", "fort"],
        risqueCavitesSouterraines: ["non", "oui"],
        risqueInondation: ["non", "oui"],
        zonageEnvironnemental: [
          "hors-zone",
          "natura-2000",
          "znieff-type-1-2",
          "parc-naturel-regional",
          "parc-naturel-national",
          "reserve-naturelle",
          "proximite-zone",
        ],
        zonageReglementaire: [
          "zone-urbaine-u",
          "zone-urbaine-u-habitat",
          "zone-a-urbaniser-au",
          "zone-agricole-a",
          "zone-naturelle-n",
        ],
        zonagePatrimonial: ["hors-zone", "monument-historique", "site-patrimonial-remarquable"],
        trameVerteEtBleue: ["hors-zone", "reservoir-biodiversite", "corridor-ecologique"],
        distanceIte: ["moins-1km", "entre-1-5km", "plus-5km"],
      },
      saisie: {
        typeProprietaire: ["public", "prive", "mixte", "copro-indivision", "ne-sait-pas"],
        raccordementEau: ["oui", "non", "ne-sait-pas"],
        etatBatiInfrastructure: [
          "degradation-inexistante",
          "degradation-faible",
          "degradation-tres-importante",
        ],
        presencePollution: ["non", "demontree-traitee", "demontree-non-traitee", "ne-sait-pas"],
        valeurArchitecturaleHistorique: [
          "sans-interet",
          "ordinaire",
          "interet-remarquable",
          "ne-sait-pas",
        ],
        qualitePaysage: ["degrade", "ordinaire", "remarquable", "ne-sait-pas"],
        qualiteVoieDesserte: ["degradee", "praticable", "accessible", "ne-sait-pas"],
      },
      usages: [
        "residentiel",
        "equipements",
        "culture",
        "tertiaire",
        "industrie",
        "renaturation",
        "photovoltaique",
      ],
    },
  })
  enums: {
    enrichissement: Record<string, string[]>;
    saisie: Record<string, string[]>;
    usages: string[];
  };

  @ApiProperty({
    description:
      "Versions actuellement servies par l'API. `api` suit le `package.json` du backend. `algorithme` correspond à la version courante (la liste complète est disponible via `GET /evaluation/algorithme/versions`).",
    example: { api: "2.0.0", algorithme: "v1.9" },
  })
  version: {
    api: string;
    algorithme: string;
  };
}
