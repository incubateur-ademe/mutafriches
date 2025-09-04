import { ApiProperty } from "@nestjs/swagger";

export class DetailCritereDto {
  @ApiProperty({
    description: "Nom du critère évalué",
    example: "centreVilleCentreBourg",
  })
  critere: string;

  @ApiProperty({
    description: "Valeur du critère",
    example: true,
  })
  valeur: any;

  @ApiProperty({
    description: "Score brut avant pondération",
    example: 3,
  })
  scoreBrut: number;

  @ApiProperty({
    description: "Poids appliqué au critère",
    example: 1.5,
  })
  poids: number;

  @ApiProperty({
    description: "Score final après pondération",
    example: 4.5,
  })
  scorePondere: number;
}

export class DetailCalculUsageDto {
  @ApiProperty({
    description: "Liste des critères contribuant positivement",
    type: [DetailCritereDto],
  })
  detailsAvantages: DetailCritereDto[];

  @ApiProperty({
    description: "Liste des critères contribuant négativement",
    type: [DetailCritereDto],
  })
  detailsContraintes: DetailCritereDto[];

  @ApiProperty({
    description: "Somme totale des avantages",
    example: 15.5,
  })
  totalAvantages: number;

  @ApiProperty({
    description: "Somme totale des contraintes",
    example: 2,
  })
  totalContraintes: number;
}
