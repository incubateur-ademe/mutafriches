import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

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
  identifiant: string;

  @ApiProperty({
    description: "Code INSEE de la commune",
    example: "49353",
  })
  @IsString()
  @IsNotEmpty()
  codeInsee: string;
}
