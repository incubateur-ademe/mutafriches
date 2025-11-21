import { ApiProperty } from "@nestjs/swagger";
import {
  EnrichissementOutputDto,
  MutabiliteOutputDto,
  DonneesComplementairesInputDto,
  APP_CONFIG,
} from "@mutafriches/shared-types";

/**
 * DTO pour la récupération d'une évaluation complète
 * Endpoint: GET /api/friches/evaluations/:id
 */
export class EvaluationSwaggerDto {
  @ApiProperty({
    description: "Identifiant unique de l'évaluation",
    example: "eval-550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "Identifiant cadastral de la parcelle évaluée",
    example: "490055000AI0001",
  })
  identifiantParcelle: string;

  @ApiProperty({
    description: "Date de création de l'évaluation",
    example: "2024-03-15T10:30:00Z",
  })
  dateCreation: Date;

  @ApiProperty({
    description: "Date de dernière modification",
    example: "2024-03-15T10:35:00Z",
    required: false,
  })
  dateModification?: Date;

  @ApiProperty({
    description: "Données d'enrichissement utilisées",
    type: Object,
  })
  enrichissement: EnrichissementOutputDto;

  @ApiProperty({
    description: "Données complémentaires saisies",
    type: Object,
    required: false,
  })
  donneesComplementaires?: DonneesComplementairesInputDto;

  @ApiProperty({
    description: "Résultats de mutabilité",
    type: Object,
  })
  mutabilite: MutabiliteOutputDto;

  @ApiProperty({
    description: "Métadonnées de l'évaluation",
    example: {
      versionAlgorithme: APP_CONFIG.versionAlgo,
      source: "iframe",
      integrator: "urbanvitaliz",
      dureeCalculMs: 1250,
    },
  })
  metadata: {
    versionAlgorithme: string;
    source?: string;
    integrator?: string;
    dureeCalculMs?: number;
  };
}
