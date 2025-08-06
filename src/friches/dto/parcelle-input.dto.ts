import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO pour l'entrée des données de parcelle
 */
export class ParcelleInputDto {
  @ApiProperty({
    description:
      'Identifiant cadastral unique de la parcelle (format standard français)',
    example: '490007000ZE0153',
    pattern: '^[0-9]{6}[0-9]{3}[A-Z]{2}[0-9]{4}$',
    minLength: 15,
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty({ message: "L'identifiant de parcelle est obligatoire" })
  @Matches(/^[0-9]{6}[0-9]{3}[A-Z]{2}[0-9]{4}$/, {
    message:
      "Format d'identifiant parcelle invalide (attendu: 490007000ZE0153)",
  })
  identifiantParcelle: string;
}
