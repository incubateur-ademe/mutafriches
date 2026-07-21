import { ApiProperty } from "@nestjs/swagger";
import {
  EnrichissementOutputDto,
  MutabiliteOutputDto,
  DonneesComplementairesInputDto,
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
    description:
      "Identifiant cadastral de la parcelle évaluée (parcelle prédominante en multi-parcelle)",
    example: "49353000AV0202",
  })
  identifiantParcelle: string;

  @ApiProperty({
    description: "Liste des identifiants cadastraux (présent en mode multi-parcelle)",
    required: false,
    type: [String],
    example: ["49353000AV0202", "49353000AV0203"],
  })
  identifiantsParcelles?: string[];

  @ApiProperty({
    description: "Nombre de parcelles du site (présent en mode multi-parcelle)",
    required: false,
    example: 2,
  })
  nombreParcelles?: number;

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
    description:
      "Métadonnées de l'évaluation. `source` indique le canal d'appel (`api` pour cet endpoint, `iframe` ou `standalone` pour les évaluations créées via les autres canaux). `integrator` est renseigné si l'évaluation a été déclenchée par un intégrateur tiers identifié.",
    example: {
      versionAlgorithme: "v1.11",
      source: "api",
      integrator: "benefriches",
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
