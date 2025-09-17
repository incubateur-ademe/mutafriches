import { ApiProperty } from "@nestjs/swagger";
import { EnrichirParcelleInputDto as IEnrichirParcelleInput } from "@mutafriches/shared-types";

/**
 * DTO Swagger pour l'enrichissement d'une parcelle
 * Dupliqué depuis @mutafriches/shared-types pour ajouter les décorateurs Swagger
 */
export class EnrichirParcelleSwaggerDto implements IEnrichirParcelleInput {
  @ApiProperty({
    description: "Identifiant cadastral unique de la parcelle",
    example: "25056000HZ0346",
    pattern: "^[0-9]{5}[0-9]{3}[A-Z]{2}[0-9]{4}$",
  })
  identifiant: string;
}
