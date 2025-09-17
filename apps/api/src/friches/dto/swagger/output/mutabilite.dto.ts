import { ApiProperty } from "@nestjs/swagger";
import {
  MutabiliteOutputDto as IMutabiliteOutput,
  UsageResultat,
  Fiabilite,
  UsageType,
} from "@mutafriches/shared-types";

/**
 * DTO Swagger pour le résultat de calcul de mutabilité
 * Dupliqué depuis @mutafriches/shared-types pour ajouter les décorateurs Swagger
 */
export class MutabiliteSwaggerDto implements IMutabiliteOutput {
  @ApiProperty({
    description: "Évaluation de la fiabilité du calcul",
    example: {
      note: 8.5,
      text: "Très fiable",
      description: "Données complètes et vérifiées pour 85% des critères analysés",
      criteresRenseignes: 22,
      criteresTotal: 26,
    },
    type: Object,
  })
  fiabilite: Fiabilite;

  @ApiProperty({
    description: "Résultats pour les 7 usages, triés par potentiel décroissant",
    type: "array",
    items: {
      type: "object",
      properties: {
        rang: { type: "number", minimum: 1, maximum: 7 },
        usage: { type: "string", enum: Object.values(UsageType) },
        indiceMutabilite: { type: "number", minimum: 0, maximum: 100 },
        potentiel: { type: "string" },
        explication: { type: "string" },
      },
    },
    example: [
      {
        rang: 7,
        usage: UsageType.RESIDENTIEL,
        indiceMutabilite: 68,
        potentiel: "Favorable",
        explication: "Site favorable grâce à sa localisation en centre-ville",
      },
      {
        rang: 6,
        usage: UsageType.EQUIPEMENTS,
        indiceMutabilite: 63,
        potentiel: "Favorable",
        explication: "Bonne accessibilité et superficie adaptée",
      },
    ],
  })
  resultats: UsageResultat[];

  @ApiProperty({
    description: "ID de l'évaluation sauvegardée (optionnel)",
    example: "eval_1234567890abcdef",
    required: false,
  })
  evaluationId?: string;
}
