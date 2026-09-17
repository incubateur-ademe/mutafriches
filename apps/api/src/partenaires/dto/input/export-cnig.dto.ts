import { IsBoolean, IsIn, IsObject, IsOptional, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  DonneesComplementairesInputDto,
  ExportCnigInputDto,
  FormatExportCnig,
  MutabiliteResumeeExportDto,
} from "@mutafriches/shared-types";

/**
 * Corps de POST /api/partenaires/:slug/export.
 *
 * `connaissanceTerrain` et `mutabilite` sont validés comme objets libres : leurs valeurs ne
 * sont jamais recopiées telles quelles dans le fichier, elles passent par les correspondances
 * CNIG qui retombent sur « inconnu » pour toute valeur non reconnue.
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

  @ApiPropertyOptional({ description: "Mutabilité résumée par idtup, calculée côté client." })
  @IsOptional()
  @IsObject()
  mutabilite?: Record<string, MutabiliteResumeeExportDto>;

  // Recopiée telle quelle dans le fichier : restreinte au format des versions d'algorithme.
  @ApiPropertyOptional({ example: "1.13" })
  @IsOptional()
  @Matches(/^\d{1,3}(\.\d{1,3}){0,2}$/, {
    message: "versionAlgorithme doit être une version de la forme 1.13",
  })
  versionAlgorithme?: string;
}
