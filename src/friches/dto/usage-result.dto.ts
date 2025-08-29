import { ApiProperty } from '@nestjs/swagger';
import { UsageType } from '../enums/mutability.enums';

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
    example: 'residentiel',
    enum: [
      'residentiel',
      'equipements',
      'culture',
      'tertiaire',
      'industrie',
      'renaturation',
      'photovoltaique',
    ],
  })
  usage: UsageType;

  // @ApiProperty({
  //   description: 'Explication détaillée des facteurs influençant le score',
  //   example:
  //     'Site favorable grâce à sa localisation en centre-ville, sa desserte et la proximité des services.',
  // })
  // explication: string;

  @ApiProperty({
    description: 'Indice de mutabilité calculé pour cet usage (0-100)',
    example: 68,
    minimum: 0,
    maximum: 100,
  })
  indiceMutabilite: number;

  @ApiProperty({
    description: "Total des points d'avantages pour cet usage",
    example: 15,
    minimum: 0,
  })
  avantages: number;

  @ApiProperty({
    description: 'Total des points de contraintes pour cet usage',
    example: 7,
    minimum: 0,
  })
  contraintes: number;

  // @ApiProperty({
  //   description: 'Évaluation qualitative du potentiel',
  //   example: 'Favorable',
  //   enum: [
  //     'Très favorable',
  //     'Favorable',
  //     'Modéré',
  //     'Peu favorable',
  //     'Défavorable',
  //   ],
  // })
  // potentiel:
  //   | 'Très favorable'
  //   | 'Favorable'
  //   | 'Modéré'
  //   | 'Peu favorable'
  //   | 'Défavorable';
}
