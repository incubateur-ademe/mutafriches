import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  ManualFormDataDto,
  TypeProprietaire,
  EtatBati,
  PresencePollution,
  QualiteVoieDesserte,
  QualitePaysage,
  ValeurArchitecturale,
} from "@mutafriches/shared-types";

/**
 * DTO pour les données manuelles saisies par l'utilisateur
 * Utilisé pour compléter les données automatiques avant le calcul de mutabilité
 */
export class ManualDataInputDto implements ManualFormDataDto {
  @ApiPropertyOptional({
    description: "Type de propriétaire",
    enum: TypeProprietaire,
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire?: string;

  @ApiPropertyOptional({
    description: "Site connecté aux réseaux d'eau",
    example: "oui",
  })
  terrainViabilise?: string;

  @ApiPropertyOptional({
    description: "État général du bâti et des infrastructures",
    enum: EtatBati,
    example: EtatBati.BATIMENTS_HETEROGENES,
  })
  etatBatiInfrastructure?: string;

  @ApiPropertyOptional({
    description: "Présence de pollution connue ou suspectée",
    enum: PresencePollution,
    example: PresencePollution.NE_SAIT_PAS,
  })
  presencePollution?: string;

  @ApiPropertyOptional({
    description: "Valeur architecturale et/ou historique du site",
    enum: ValeurArchitecturale,
    example: ValeurArchitecturale.BANAL_INFRA_ORDINAIRE,
  })
  valeurArchitecturaleHistorique?: string;

  @ApiPropertyOptional({
    description: "Qualité du paysage environnant",
    enum: QualitePaysage,
    example: QualitePaysage.BANAL_INFRA_ORDINAIRE,
  })
  qualitePaysage?: string;

  @ApiPropertyOptional({
    description: "Qualité de la voie de desserte",
    enum: QualiteVoieDesserte,
    example: QualiteVoieDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte?: string;
}
