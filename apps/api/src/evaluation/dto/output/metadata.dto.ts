import { ApiProperty } from "@nestjs/swagger";
import {
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageEnvironnemental,
  ZonageReglementaire,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  DistanceIte,
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  UsageType,
} from "@mutafriches/shared-types";

/**
 * Exemple dérivé dynamiquement des enums réels — garantit la cohérence
 * entre la doc Swagger et les valeurs effectivement servies par le controller.
 */
const ENUMS_EXAMPLE = {
  enrichissement: {
    risqueRetraitGonflementArgile: Object.values(RisqueRetraitGonflementArgile),
    risqueCavitesSouterraines: Object.values(RisqueCavitesSouterraines),
    risqueInondation: Object.values(RisqueInondation),
    zonageEnvironnemental: Object.values(ZonageEnvironnemental),
    zonageReglementaire: Object.values(ZonageReglementaire),
    zonagePatrimonial: Object.values(ZonagePatrimonial),
    trameVerteEtBleue: Object.values(TrameVerteEtBleue),
    distanceIte: Object.values(DistanceIte),
  },
  saisie: {
    typeProprietaire: Object.values(TypeProprietaire),
    raccordementEau: Object.values(RaccordementEau),
    etatBatiInfrastructure: Object.values(EtatBatiInfrastructure),
    presencePollution: Object.values(PresencePollution),
    valeurArchitecturaleHistorique: Object.values(ValeurArchitecturale),
    qualitePaysage: Object.values(QualitePaysage),
    qualiteVoieDesserte: Object.values(QualiteVoieDesserte),
  },
  usages: Object.values(UsageType),
};

/**
 * DTO Swagger représentant les métadonnées de l'évaluation.
 */
export class MetadataSwaggerDto {
  @ApiProperty({
    description:
      "Enums groupés par catégorie. `enrichissement` = valeurs renvoyées par l'API d'enrichissement. `saisie` = valeurs attendues dans les données complémentaires (les 8 champs saisis manuellement). `usages` = les 7 usages évalués par l'algorithme. La valeur `ne-sait-pas` indique que l'utilisateur n'a pas pu répondre (ne contribue pas à la fiabilité).",
    example: ENUMS_EXAMPLE,
  })
  enums: {
    enrichissement: Record<string, string[]>;
    saisie: Record<string, string[]>;
    usages: string[];
  };

  @ApiProperty({
    description:
      "Versions actuellement servies par l'API. `api` suit le `package.json` du backend. `algorithme` correspond à la version courante (la liste complète est disponible via `GET /evaluation/algorithme/versions`).",
    example: { api: "2.0.0", algorithme: "v1.11" },
  })
  version: {
    api: string;
    algorithme: string;
  };
}
