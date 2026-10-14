import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

// Cinq chiffres, ou 2A/2B pour la Corse. Le code est transmis tel quel à l'API Cerema.
export const CODE_INSEE_PATTERN = /^(\d{5}|2[AB]\d{3})$/;

/**
 * Paramètre de récupération des friches Cartofriches d'une commune.
 */
export class CommuneCartofrichesQueryDto {
  @ApiProperty({ description: "Code INSEE de la commune", example: "49353" })
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_INSEE_PATTERN, { message: "Code INSEE invalide" })
  codeInsee: string;
}
