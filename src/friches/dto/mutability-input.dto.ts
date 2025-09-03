import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelleBase } from '../entities/shared/parcelle.base';
import { EnrichmentResultDto } from './enrichment-result.dto';
import {
  CouvertVegetal,
  EtatBati,
  PresenceEspeceProtegee,
  PresencePollution,
  QualiteDesserte,
  QualitePaysage,
  ReseauEaux,
  TypeProprietaire,
  ValeurArchitecturale,
  VoieEauProximite,
  ZoneHumide,
} from '../enums/parcelle.enums';

/**
 * DTO pour les données complètes d'une parcelle pour le calcul de mutabilité
 * Combine les données automatiques enrichies et les données manuelles saisies
 */
export class MutabilityInputDto
  extends EnrichmentResultDto
  implements ParcelleBase
{
  @ApiPropertyOptional({
    description: 'Type de propriétaire (complément manuel)',
    enum: TypeProprietaire,
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire?: TypeProprietaire;

  @ApiPropertyOptional({
    description: "Site connecté aux réseaux d'eau (complément manuel)",
    enum: ReseauEaux,
    example: ReseauEaux.OUI,
  })
  reseauEaux?: ReseauEaux;

  @ApiPropertyOptional({
    description:
      'État général du bâti et des infrastructures (complément manuel)',
    enum: EtatBati,
    example: EtatBati.BATIMENTS_HETEROGENES,
  })
  etatBatiInfrastructure?: EtatBati;

  @ApiPropertyOptional({
    description:
      'Présence de pollution connue ou suspectée (complément manuel)',
    enum: PresencePollution,
    example: PresencePollution.NE_SAIT_PAS,
  })
  presencePollution?: PresencePollution;

  @ApiPropertyOptional({
    description:
      'Valeur architecturale et/ou historique du site (complément manuel)',
    enum: ValeurArchitecturale,
    example: ValeurArchitecturale.EXCEPTIONNEL,
  })
  valeurArchitecturaleHistorique?: ValeurArchitecturale;

  @ApiPropertyOptional({
    description: 'Qualité du paysage environnant (complément manuel)',
    enum: QualitePaysage,
    example: QualitePaysage.BANAL_INFRA_ORDINAIRE,
  })
  qualitePaysage?: QualitePaysage;

  @ApiPropertyOptional({
    description: 'Qualité de la voie de desserte (complément manuel)',
    enum: QualiteDesserte,
    example: QualiteDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte?: QualiteDesserte;

  @ApiPropertyOptional({
    description: 'Identifiant de session pour lier avec les résultats',
    example: 'session-uuid-12345',
  })
  sessionId?: string;

  /* ----------------------------------------------- */
  // Critères additionnels
  // (utilisés uniquement en test pour l'instant et surement supprimés de la version finale car impossible à retrouver depuis le module d'enrichissement)
  /* ----------------------------------------------- */

  @ApiPropertyOptional({
    description: 'Terrain en pente supérieure à 20°',
    example: false,
  })
  terrainEnPente?: boolean;

  @ApiPropertyOptional({
    description: "Présence et type de voie d'eau à proximité",
    enum: VoieEauProximite,
    example: VoieEauProximite.NON,
  })
  voieEauProximite?: VoieEauProximite;

  @ApiPropertyOptional({
    description: 'Type de couverture végétale du terrain',
    enum: CouvertVegetal,
    example: CouvertVegetal.IMPERMEABILISE,
  })
  couvertVegetal?: CouvertVegetal;

  @ApiPropertyOptional({
    description: "Présence d'espèces protégées sur le site",
    enum: PresenceEspeceProtegee,
    example: PresenceEspeceProtegee.NON,
  })
  presenceEspeceProtegee?: PresenceEspeceProtegee;

  @ApiPropertyOptional({
    description: 'Présence de zones humides',
    enum: ZoneHumide,
    example: ZoneHumide.ABSENCE,
  })
  zoneHumide?: ZoneHumide;
}
