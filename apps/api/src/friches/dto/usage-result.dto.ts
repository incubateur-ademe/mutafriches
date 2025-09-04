import { ApiProperty } from "@nestjs/swagger";
import { UsageResultDto as IUsageResultDto, TypeUsage } from "@mutafriches/shared-types";

export class UsageResultDto implements IUsageResultDto {
  @ApiProperty({
    description: "Rang dans le classement (1 = meilleur usage)",
    example: 1,
    minimum: 1,
    maximum: 7,
  })
  rang: number;

  @ApiProperty({
    description: "Type d'usage évalué",
    enum: TypeUsage,
    example: TypeUsage.RESIDENTIEL_MIXTE,
  })
  usage: string;

  @ApiProperty({
    description: "Explication du score",
    example: "Site favorable grâce à sa localisation en centre-ville",
  })
  explication?: string;

  @ApiProperty({
    description: "Indice de mutabilité en pourcentage",
    example: 68,
    minimum: 0,
    maximum: 100,
  })
  indiceMutabilite: number;

  @ApiProperty({
    description: "Niveau de potentiel",
    example: "Favorable",
  })
  potentiel?: string;
}
