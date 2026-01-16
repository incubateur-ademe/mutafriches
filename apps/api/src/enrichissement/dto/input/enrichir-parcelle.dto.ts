import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { EnrichirParcelleInputDto as IEnrichirParcelleInput } from "@mutafriches/shared-types";
import { IsValidParcelId } from "../../../shared/validators";

/**
 * DTO Swagger pour l'enrichissement d'une parcelle
 * Dupliqué depuis @mutafriches/shared-types pour ajouter les décorateurs Swagger
 */
export class EnrichirParcelleSwaggerDto implements IEnrichirParcelleInput {
  @ApiProperty({
    description: "Identifiant cadastral unique de la parcelle",
    example: "25056000HZ0346",
  })
  @IsNotEmpty({ message: "L'identifiant cadastral est requis" })
  @IsString({ message: "L'identifiant cadastral doit être une chaîne de caractères" })
  @IsValidParcelId()
  identifiant: string;
}
