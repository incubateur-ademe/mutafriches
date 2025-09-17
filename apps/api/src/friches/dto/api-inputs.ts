import { ApiProperty } from "@nestjs/swagger";
import {
  DonneesComplementairesInputDto as IDonneesComplementaires,
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
} from "@mutafriches/shared-types";

// Duplication nécessaire pour Swagger
export class DonneesComplementairesDto implements IDonneesComplementaires {
  @ApiProperty({
    enum: TypeProprietaire,
    description: "Type de propriétaire de la parcelle",
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire: TypeProprietaire;

  @ApiProperty({
    enum: TerrainViabilise,
    description: "Site connecté aux réseaux d'eau et assainissement",
    example: TerrainViabilise.OUI,
  })
  terrainViabilise: TerrainViabilise;

  @ApiProperty({
    enum: EtatBatiInfrastructure,
    description: "État général du bâti et des infrastructures",
    example: EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
  })
  etatBatiInfrastructure: EtatBatiInfrastructure;

  @ApiProperty({
    enum: PresencePollution,
    description: "Présence de pollution connue ou suspectée",
    example: PresencePollution.NE_SAIT_PAS,
  })
  presencePollution: PresencePollution;

  @ApiProperty({
    enum: ValeurArchitecturale,
    description: "Valeur architecturale et/ou historique du site",
    example: ValeurArchitecturale.BANAL_INFRA_ORDINAIRE,
  })
  valeurArchitecturaleHistorique: ValeurArchitecturale;

  @ApiProperty({
    enum: QualitePaysage,
    description: "Qualité du paysage environnant",
    example: QualitePaysage.BANAL_INFRA_ORDINAIRE,
  })
  qualitePaysage: QualitePaysage;

  @ApiProperty({
    enum: QualiteVoieDesserte,
    description: "Qualité et accessibilité de la voie de desserte",
    example: QualiteVoieDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte: QualiteVoieDesserte;
}

export class EvaluerParcelleInputDto {
  @ApiProperty({
    description: "Identifiant cadastral de la parcelle",
    example: "25056000HZ0346",
  })
  identifiant: string;

  @ApiProperty({
    description: "Données complémentaires saisies par l'utilisateur",
    type: DonneesComplementairesDto,
  })
  donneesComplementaires: DonneesComplementairesDto;
}
