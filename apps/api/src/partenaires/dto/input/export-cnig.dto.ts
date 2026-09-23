import { IsBoolean, IsIn, IsObject, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  DonneesComplementairesInputDto,
  ExportCnigInputDto,
  FormatExportCnig,
} from "@mutafriches/shared-types";

/**
 * Corps de POST /api/partenaires/:slug/export.
 *
 * `connaissanceTerrain` est validé comme objet libre : ses valeurs ne sont jamais recopiées
 * telles quelles dans le fichier, elles passent par les correspondances CNIG qui retombent
 * sur « inconnu » pour toute valeur non reconnue.
 */
export class ExportCnigDto implements ExportCnigInputDto {
  @ApiProperty({ enum: ["csv", "geojson"], example: "csv" })
  @IsIn(["csv", "geojson"])
  format: FormatExportCnig;

  @ApiPropertyOptional({
    description: "Ajoute les colonnes mf_*, hors standard CNIG.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  inclureMutabilite?: boolean;

  @ApiPropertyOptional({
    description:
      "Connaissance terrain par idtup, saisie localement par l'utilisateur. Non persistée.",
  })
  @IsOptional()
  @IsObject()
  connaissanceTerrain?: Record<string, DonneesComplementairesInputDto>;
}
