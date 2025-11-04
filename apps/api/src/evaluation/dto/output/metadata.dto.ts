import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO Swagger représentant les métadonnées de l'évaluation.
 */
export class MetadataSwaggerDto {
  @ApiProperty({
    description: "Enums groupés par catégorie",
    example: {
      enrichissement: {
        risqueNaturel: ["aucun", "faible", "moyen", "fort", "ne-sait-pas"],
        zonageEnvironnemental: ["hors-zone", "znieff-1", "znieff-2", "natura-2000", "ne-sait-pas"],
      },
      saisie: {
        typeProprietaire: ["public", "prive", "mixte", "copro-indivision", "ne-sait-pas"],
        raccordementEau: ["oui", "non", "ne-sait-pas"],
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
    description: "Versions",
    example: { api: "1.0.0", algorithme: "1.0.0" },
  })
  version: {
    api: string;
    algorithme: string;
  };
}
