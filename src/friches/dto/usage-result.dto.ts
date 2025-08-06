import { ApiProperty } from '@nestjs/swagger';

export class UsageResultDto {
  @ApiProperty({
    description:
      "Rang de classement de l'usage (1 = moins favorable, 7 = plus favorable)",
    example: 7,
    minimum: 1,
    maximum: 7,
  })
  rang: number;

  @ApiProperty({
    description: "Type d'usage analysé",
    example: 'Résidentiel ou mixte',
    enum: [
      'Résidentiel ou mixte',
      'Équipements publics',
      'Culture, tourisme',
      'Tertiaire',
      'Industrie',
      'Renaturation',
      'Photovoltaïque au sol',
    ],
  })
  usage: string;

  @ApiProperty({
    description: 'Explication détaillée des facteurs influençant le score',
    example:
      'Site favorable grâce à sa localisation en centre-ville, sa desserte et la proximité des services.',
  })
  explication: string;

  @ApiProperty({
    description: 'Indice de mutabilité calculé pour cet usage (0-100)',
    example: 68,
    minimum: 0,
    maximum: 100,
  })
  indiceMutabilite: number;

  @ApiProperty({
    description: 'Évaluation qualitative du potentiel',
    example: 'Favorable',
    enum: [
      'Très favorable',
      'Favorable',
      'Modéré',
      'Peu favorable',
      'Défavorable',
    ],
  })
  potentiel:
    | 'Très favorable'
    | 'Favorable'
    | 'Modéré'
    | 'Peu favorable'
    | 'Défavorable';
}
