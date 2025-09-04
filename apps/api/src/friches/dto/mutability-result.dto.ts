import { ApiProperty } from "@nestjs/swagger";
import { UsageResultDto } from "./usage-result.dto";

class FiabiliteDto {
  @ApiProperty({
    description: "Note de fiabilité sur 10",
    example: 9.5,
    minimum: 0,
    maximum: 10,
  })
  note: number;

  @ApiProperty({
    description: "Évaluation textuelle de la fiabilité",
    example: "Très fiable",
    enum: ["Très fiable", "Fiable", "Moyennement fiable", "Peu fiable", "Non fiable"],
  })
  text: string;

  @ApiProperty({
    description: "Description détaillée de la fiabilité",
    example: "Données complètes et vérifiées pour 95% des critères analysés.",
  })
  description: string;

  @ApiProperty({
    description: "Nombre de critères renseignés",
    example: 22,
    required: false,
  })
  criteresRenseignes?: number;

  @ApiProperty({
    description: "Nombre total de critères mappés",
    example: 26,
    required: false,
  })
  criteresTotal?: number;
}

export class MutabilityResultDto {
  @ApiProperty({
    description: "Évaluation de la fiabilité des résultats",
    type: FiabiliteDto,
  })
  fiabilite: FiabiliteDto;

  @ApiProperty({
    description: "Résultats détaillés pour chaque usage, classés par potentiel décroissant",
    type: [UsageResultDto],
    example: [
      {
        rang: 7,
        usage: "Résidentiel ou mixte",
        explication:
          "Site favorable grâce à sa localisation en centre-ville, sa desserte et la proximité des services.",
        indiceMutabilite: 68,
        potentiel: "Favorable",
      },
      {
        rang: 6,
        usage: "Équipements publics",
        explication: "Bonne accessibilité et superficie adaptée pour équipements collectifs.",
        indiceMutabilite: 63,
        potentiel: "Favorable",
      },
      {
        rang: 5,
        usage: "Tertiaire",
        explication: "Desserte correcte mais concurrence forte en centre-ville.",
        indiceMutabilite: 60,
        potentiel: "Modéré",
      },
      {
        rang: 4,
        usage: "Culture, tourisme",
        explication: "Valeur patrimoniale exceptionnelle compensant les contraintes techniques.",
        indiceMutabilite: 56,
        potentiel: "Modéré",
      },
      {
        rang: 3,
        usage: "Industrie",
        explication: "Contraintes d'accessibilité et proximité résidentielle limitantes.",
        indiceMutabilite: 54,
        potentiel: "Peu favorable",
      },
      {
        rang: 2,
        usage: "Photovoltaïque au sol",
        explication: "Exposition correcte mais surface partiellement occupée par du bâti.",
        indiceMutabilite: 47,
        potentiel: "Peu favorable",
      },
      {
        rang: 1,
        usage: "Renaturation",
        explication: "Site imperméabilisé nécessitant des travaux lourds de dépollution.",
        indiceMutabilite: 41,
        potentiel: "Défavorable",
      },
    ],
  })
  resultats: UsageResultDto[];
}
