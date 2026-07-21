import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/**
 * Paramètre de récupération des friches Cartofriches d'une commune.
 */
export class CommuneCartofrichesQueryDto {
  @ApiProperty({ description: "Code INSEE de la commune", example: "49353" })
  @IsString()
  @IsNotEmpty()
  codeInsee: string;
}
