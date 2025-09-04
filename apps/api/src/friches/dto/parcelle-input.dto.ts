import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, Matches } from "class-validator";
import { parcelIdRegex } from "../lib/friches.utils";

/**
 * DTO pour l'entrée des données de parcelle
 */
export class ParcelleInputDto {
  @ApiProperty({
    description: "Identifiant cadastral unique de la parcelle (format standard français)",
    example: "25056000HZ0346",
    pattern: "^\\d{8}[A-Z0-9]{2}\\d{4}$",
    minLength: 15,
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty({ message: "L'identifiant de parcelle est obligatoire" })
  @Matches(parcelIdRegex, {
    message: "Format d'identifiant parcelle invalide (attendu: 25056000HZ0346)",
  })
  identifiantParcelle: string;
}
