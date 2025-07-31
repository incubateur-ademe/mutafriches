import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ParcelleInputDto {
  @IsString()
  @IsNotEmpty({ message: "L'identifiant de parcelle est obligatoire" })
  @Matches(/^[0-9]{6}[0-9]{3}[A-Z]{2}[0-9]{4}$/, {
    message:
      "Format d'identifiant parcelle invalide (attendu: 490007000ZE0153)",
  })
  identifiantParcelle: string;
}
