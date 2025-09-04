import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  MutabilityInputDto as IMutabilityInputDto,
  TypeProprietaire,
  EtatBati,
  PresencePollution,
  QualiteVoieDesserte,
  QualitePaysage,
  ValeurArchitecturale,
  CouvertVegetal,
  PresenceEspeceProtegee,
  VoieEauProximite,
  ZoneHumide,
} from "@mutafriches/shared-types";
import { EnrichmentResultDto } from "./enrichment-result.dto";
import { ParcelleBase } from "../entities/shared/parcelle.base";

/**
 * DTO pour les données complètes d'une parcelle pour le calcul de mutabilité
 * Combine les données automatiques enrichies et les données manuelles saisies
 */
export class MutabilityInputDto
  extends EnrichmentResultDto
  implements IMutabilityInputDto, ParcelleBase
{
  @ApiPropertyOptional({
    description: "Type de propriétaire (complément manuel)",
    enum: TypeProprietaire,
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire?: string;

  @ApiPropertyOptional({
    description: "Site connecté aux réseaux d'eau (complément manuel)",
    example: true,
  })
  terrainViabilise?: string;

  @ApiPropertyOptional({
    description: "État général du bâti et des infrastructures (complément manuel)",
    enum: EtatBati,
    example: EtatBati.BATIMENTS_HETEROGENES,
  })
  etatBatiInfrastructure?: string;

  @ApiPropertyOptional({
    description: "Présence de pollution connue ou suspectée (complément manuel)",
    enum: PresencePollution,
    example: PresencePollution.NE_SAIT_PAS,
  })
  presencePollution?: string;

  @ApiPropertyOptional({
    description: "Valeur architecturale et/ou historique du site (complément manuel)",
    enum: ValeurArchitecturale,
    example: ValeurArchitecturale.ORDINAIRE,
  })
  valeurArchitecturaleHistorique?: string;

  @ApiPropertyOptional({
    description: "Qualité du paysage environnant (complément manuel)",
    enum: QualitePaysage,
    example: QualitePaysage.INTERESSANT,
  })
  qualitePaysage?: string;

  @ApiPropertyOptional({
    description: "Qualité de la voie de desserte (complément manuel)",
    enum: QualiteVoieDesserte,
    example: QualiteVoieDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte?: string;

  @ApiPropertyOptional({
    description: "Identifiant de session pour lier avec les résultats",
    example: "session-uuid-12345",
  })
  sessionId?: string;

  /* ----------------------------------------------- */
  // Critères additionnels
  // (utilisés uniquement en test pour l'instant et surement supprimés de la version finale car impossible à retrouver depuis le module d'enrichissement)
  /* ----------------------------------------------- */

  @ApiPropertyOptional({
    description: "Terrain en pente supérieure à 20°",
    example: false,
  })
  terrainEnPente?: boolean;

  @ApiPropertyOptional({
    description: "Présence et type de voie d'eau à proximité",
    enum: VoieEauProximite,
    example: VoieEauProximite.NON,
  })
  voieEauProximite?: string;

  @ApiPropertyOptional({
    description: "Type de couverture végétale du terrain",
    enum: CouvertVegetal,
    example: CouvertVegetal.IMPERMEABILISE,
  })
  couvertVegetal?: string;

  @ApiPropertyOptional({
    description: "Présence d'espèces protégées sur le site",
    enum: PresenceEspeceProtegee,
    example: PresenceEspeceProtegee.NON,
  })
  presenceEspeceProtegee?: string;

  @ApiPropertyOptional({
    description: "Présence de zones humides",
    enum: ZoneHumide,
    example: ZoneHumide.ABSENCE,
  })
  zoneHumide?: string;
}
