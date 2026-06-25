import {
  DonneesComplementairesInputDto as IDonneesComplementaires,
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Données complémentaires saisies manuellement par l'utilisateur (8 champs initialement, 10 avec les ajouts récents).
 *
 * Pour chaque champ, la valeur `ne-sait-pas` est acceptée et signifie que l'utilisateur
 * n'a pas pu répondre. Ces réponses ne contribuent ni aux avantages ni aux contraintes
 * du score, et font baisser l'indice de fiabilité. Un payload contenant au moins un
 * `ne-sait-pas` n'est **pas mis en cache** côté serveur (résultat partiel).
 */
export class DonneesComplementairesSwaggerDto implements IDonneesComplementaires {
  @ApiProperty({
    enum: TypeProprietaire,
    description:
      "Type de propriétaire de la parcelle. `public` (collectivité, État), `prive` (personne ou société privée), `mixte` (cofinancement public/privé), `copro-indivision` (copropriété ou succession).",
    example: TypeProprietaire.PRIVE,
  })
  typeProprietaire: TypeProprietaire;

  @ApiProperty({
    enum: RaccordementEau,
    required: false,
    description:
      "Raccordement aux réseaux d'eau potable et d'assainissement. Dérivé automatiquement de la surface bâtie (BDNB) côté serveur : valeur fournie ignorée, champ inutile à transmettre.",
    example: RaccordementEau.OUI,
  })
  raccordementEau?: RaccordementEau;

  @ApiProperty({
    enum: EtatBatiInfrastructure,
    description:
      "État général du bâti existant. `degradation-inexistante` (en bon état), `degradation-heterogene` (état variable selon les zones), `degradation-moyenne`, `degradation-tres-importante` (ruines, démolition probable), `pas-de-bati` (terrain nu).",
    example: EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
  })
  etatBatiInfrastructure: EtatBatiInfrastructure;

  @ApiProperty({
    enum: PresencePollution,
    description:
      "Présence de pollution connue ou suspectée. `non` (aucune), `deja-geree` (dépollution réalisée), `oui-composes-volatils` (COV, hydrocarbures), `oui-amiante`, `oui-autres-composes` (métaux lourds, etc.).",
    example: PresencePollution.NE_SAIT_PAS,
  })
  presencePollution: PresencePollution;

  @ApiProperty({
    enum: ValeurArchitecturale,
    description:
      "Valeur architecturale et/ou historique du site. `sans-interet`, `ordinaire`, `interet-remarquable` (bâti à conserver), `pas-de-bati` (terrain nu).",
    example: ValeurArchitecturale.INTERET_REMARQUABLE,
  })
  valeurArchitecturaleHistorique: ValeurArchitecturale;

  @ApiProperty({
    enum: QualitePaysage,
    description:
      "Qualité du paysage environnant. `sans-interet`, `ordinaire`, `interet-remarquable` (vue, cadre exceptionnel).",
    example: QualitePaysage.INTERET_REMARQUABLE,
  })
  qualitePaysage: QualitePaysage;

  @ApiProperty({
    enum: QualiteVoieDesserte,
    description:
      "Qualité et accessibilité de la voie qui dessert le site. `accessible` (PL et VL sans contrainte), `peu-accessible` (gabarit limité), `degradee` (chaussée à refaire).",
    example: QualiteVoieDesserte.ACCESSIBLE,
  })
  qualiteVoieDesserte: QualiteVoieDesserte;

  @ApiProperty({
    enum: TrameVerteEtBleue,
    description:
      "Position du site par rapport à la trame verte et bleue locale (SCoT, SRADDET). `hors-trame`, `reservoir-biodiversite` (cœur de biodiversité à préserver), `corridor-a-preserver` (continuité écologique existante), `corridor-a-restaurer` (continuité dégradée à reconstituer).",
    example: TrameVerteEtBleue.HORS_TRAME,
  })
  trameVerteEtBleue: TrameVerteEtBleue;

  @ApiProperty({
    enum: PresenceEspecesProtegees,
    description:
      "Présence avérée ou potentielle d'une espèce protégée sur le site (faune ou flore inscrite à un arrêté de protection).",
    example: PresenceEspecesProtegees.NE_SAIT_PAS,
  })
  presenceEspecesProtegees: PresenceEspecesProtegees;

  @ApiProperty({
    enum: PresenceZoneHumide,
    description:
      "Présence d'une zone humide sur le site (au sens de la loi sur l'eau). Une zone humide protégée peut interdire certains usages.",
    example: PresenceZoneHumide.NE_SAIT_PAS,
  })
  presenceZoneHumide: PresenceZoneHumide;
}
