import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import { CODE_INSEE_PATTERN } from "./commune-cartofriches.query.dto";

/**
 * Paramètres de recherche d'une friche Cartofriches.
 */
export class RechercheCartofrichesQueryDto {
  @ApiProperty({
    description: "Identifiant cadastral Mutafriches (mono ou multi-parcelle séparé par virgules)",
    example: "49353000AC0628",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9A-Z]{1,20}(,[0-9A-Z]{1,20}){0,65}$/, { message: "Identifiant cadastral invalide" })
  identifiant: string;

  @ApiProperty({
    description: "Code INSEE de la commune",
    example: "49353",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_INSEE_PATTERN, { message: "Code INSEE invalide" })
  codeInsee: string;
}
