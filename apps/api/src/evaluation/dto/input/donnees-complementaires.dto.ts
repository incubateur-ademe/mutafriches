import {
  DonneesComplementairesInputDto as IDonneesComplementaires,
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
} from "@mutafriches/shared-types";
import { ApiProperty } from "@nestjs/swagger";

export class DonneesComplementairesSwaggerDto implements IDonneesComplementaires {
  @ApiProperty({
    enum: TypeProprietaire,
    description: "Type de propriétaire de la parcelle",
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire: TypeProprietaire;

  @ApiProperty({
    enum: RaccordementEau,
    description: "Site connecté aux réseaux d'eau et assainissement",
    example: RaccordementEau.OUI,
  })
  raccordementEau: RaccordementEau;

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
    example: ValeurArchitecturale.INTERET_REMARQUABLE,
  })
  valeurArchitecturaleHistorique: ValeurArchitecturale;

  @ApiProperty({
    enum: QualitePaysage,
    description: "Qualité du paysage environnant",
    example: QualitePaysage.INTERET_REMARQUABLE,
  })
  qualitePaysage: QualitePaysage;

  @ApiProperty({
    enum: QualiteVoieDesserte,
    description: "Qualité et accessibilité de la voie de desserte",
    example: QualiteVoieDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte: QualiteVoieDesserte;
}
