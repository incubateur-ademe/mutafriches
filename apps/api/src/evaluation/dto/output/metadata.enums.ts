import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  DistanceIte,
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  RisqueCavitesSouterraines,
  RisqueInondation,
  RisqueRetraitGonflementArgile,
  TrameVerteEtBleue,
  TypeProprietaire,
  UsageType,
  ValeurArchitecturale,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZonageReglementaire,
} from "@mutafriches/shared-types";

/**
 * Contenu servi par `GET /evaluation/metadata`.
 *
 * Source unique : le controller le renvoie tel quel et la doc Swagger l'expose en exemple.
 * Les deux structures étaient auparavant écrites séparément et avaient divergé — un
 * intégrateur construisant son formulaire depuis cet endpoint recevait une liste de champs
 * de saisie incomplète.
 */
export const METADATA_ENUMS = {
  enrichissement: {
    risqueRetraitGonflementArgile: Object.values(RisqueRetraitGonflementArgile),
    risqueCavitesSouterraines: Object.values(RisqueCavitesSouterraines),
    risqueInondation: Object.values(RisqueInondation),
    zonageEnvironnemental: Object.values(ZonageEnvironnemental),
    zonageReglementaire: Object.values(ZonageReglementaire),
    zonagePatrimonial: Object.values(ZonagePatrimonial),
    distanceIte: Object.values(DistanceIte),
    // Déprécié à cet emplacement : critère saisi, jamais alimenté par l'enrichissement.
    // Conservé le temps d'une version pour ne pas casser un client qui l'y lit.
    trameVerteEtBleue: Object.values(TrameVerteEtBleue),
  },
  saisie: {
    typeProprietaire: Object.values(TypeProprietaire),
    etatBatiInfrastructure: Object.values(EtatBatiInfrastructure),
    presencePollution: Object.values(PresencePollution),
    valeurArchitecturaleHistorique: Object.values(ValeurArchitecturale),
    qualitePaysage: Object.values(QualitePaysage),
    qualiteVoieDesserte: Object.values(QualiteVoieDesserte),
    trameVerteEtBleue: Object.values(TrameVerteEtBleue),
    presenceEspecesProtegees: Object.values(PresenceEspecesProtegees),
    presenceZoneHumide: Object.values(PresenceZoneHumide),
    // Déprécié : dérivé de la surface bâtie côté serveur, ignoré s'il est transmis.
    raccordementEau: Object.values(RaccordementEau),
  },
  usages: Object.values(UsageType),
};

/** Champs de `donneesComplementaires` que l'appelant doit obligatoirement transmettre */
export const METADATA_CHAMPS_REQUIS: string[] = [...CHAMPS_COMPLEMENTAIRES_REQUIS];

/** Champs calculés par l'API : présents dans le contrat, ignorés s'ils sont transmis */
export const METADATA_CHAMPS_DERIVES: string[] = ["raccordementEau"];
