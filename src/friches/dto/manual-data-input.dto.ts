import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelleManualData } from '../entities/shared/parcelle-manual.interface';
import {
  TypeProprietaire,
  EtatBati,
  PresencePollution,
  QualiteDesserte,
  QualitePaysage,
  ValeurArchitecturale,
} from '../enums/parcelle.enums';

/**
 * DTO pour les données manuelles saisies par l'utilisateur
 * Utilisé pour compléter les données automatiques avant le calcul de mutabilité
 */
export class ManualDataInputDto implements ParcelleManualData {
  @ApiPropertyOptional({
    description: 'Type de propriétaire',
    enum: TypeProprietaire,
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire?: TypeProprietaire;

  @ApiPropertyOptional({
    description: "Site connecté aux réseaux d'eau",
    example: true,
  })
  terrainViabilise?: boolean;

  @ApiPropertyOptional({
    description: 'État général du bâti et des infrastructures',
    enum: EtatBati,
    example: EtatBati.BATIMENTS_HETEROGENES,
  })
  etatBatiInfrastructure?: EtatBati;

  @ApiPropertyOptional({
    description: 'Présence de pollution connue ou suspectée',
    enum: PresencePollution,
    example: PresencePollution.NE_SAIT_PAS,
  })
  presencePollution?: PresencePollution;

  @ApiPropertyOptional({
    description: 'Valeur architecturale et/ou historique du site',
    enum: ValeurArchitecturale,
    example: ValeurArchitecturale.EXCEPTIONNEL,
  })
  valeurArchitecturaleHistorique?: ValeurArchitecturale;

  @ApiPropertyOptional({
    description: 'Qualité du paysage environnant',
    enum: QualitePaysage,
    example: QualitePaysage.BANAL_INFRA_ORDINAIRE,
  })
  qualitePaysage?: QualitePaysage;

  @ApiPropertyOptional({
    description: 'Qualité de la voie de desserte',
    enum: QualiteDesserte,
    example: QualiteDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte?: QualiteDesserte;
}
