import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsArray, ArrayMaxSize, ArrayMinSize } from "class-validator";
import { EnrichirSiteInputDto as IEnrichirSiteInput } from "@mutafriches/shared-types";

/**
 * DTO Swagger pour l'enrichissement d'un site (mono ou multi-parcelle)
 *
 * Rétro-compatible : accepte `identifiant` (mono) ou `identifiants` (multi)
 * Si les deux sont fournis, `identifiants` est prioritaire.
 */
export class EnrichirSiteSwaggerDto implements IEnrichirSiteInput {
  @ApiProperty({
    description: "Identifiant cadastral unique (rétro-compatible mono-parcelle)",
    example: "25056000HZ0346",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'identifiant cadastral doit être une chaîne de caractères" })
  identifiant?: string;

  @ApiProperty({
    description: "Identifiants cadastraux multiples (multi-parcelle)",
    example: ["25056000HZ0346", "25056000HZ0347"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "Les identifiants doivent être un tableau" })
  @ArrayMinSize(1, { message: "Au moins un identifiant cadastral est requis" })
  @ArrayMaxSize(20, { message: "Maximum 20 parcelles par site" })
  @IsString({ each: true, message: "Chaque identifiant doit être une chaîne de caractères" })
  identifiants?: string[];
}
