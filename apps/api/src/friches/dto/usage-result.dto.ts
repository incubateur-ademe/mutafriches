import { ApiProperty } from "@nestjs/swagger";
import { UsageType } from "../enums/mutability.enums";
import { DetailCalculUsageDto } from "./detail-calcul.dto";

export class UsageResultDto {
  @ApiProperty({
    description: "Rang de classement de l'usage (1 = moins favorable, 7 = plus favorable)",
    example: 7,
    minimum: 1,
    maximum: 7,
  })
  rang: number;

  @ApiProperty({
    description: "Type d'usage analysé",
    example: "residentiel",
    enum: [
      "residentiel",
      "equipements",
      "culture",
      "tertiaire",
      "industrie",
      "renaturation",
      "photovoltaique",
    ],
  })
  usage: UsageType;

  @ApiProperty({
    description: "Indice de mutabilité calculé pour cet usage (0-100)",
    example: 68,
    minimum: 0,
    maximum: 100,
  })
  indiceMutabilite: number;

  @ApiProperty({
    description: "Score total des avantages pour cet usage",
    example: 15.5,
    required: false,
  })
  avantages?: number;

  @ApiProperty({
    description: "Score total des contraintes pour cet usage",
    example: 2,
    required: false,
  })
  contraintes?: number;

  @ApiProperty({
    description: "Détails du calcul critère par critère",
    type: DetailCalculUsageDto,
    required: false,
  })
  detailsCalcul?: DetailCalculUsageDto;
}
