import {
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
  QualitePaysage,
  QualiteVoieDesserte,
  TrameVerteEtBleue,
  TypeProprietaire,
  ValeurArchitecturale,
} from "@mutafriches/shared-types";

/**
 * Données complémentaires valides : les 9 champs requis renseignés.
 * `raccordementEau` est volontairement absent (dérivé de la surface bâtie côté serveur).
 */
export const DONNEES_COMPLEMENTAIRES_COMPLETES: DonneesComplementairesInputDto = {
  typeProprietaire: TypeProprietaire.PUBLIC,
  etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
  presencePollution: PresencePollution.NON,
  valeurArchitecturaleHistorique: ValeurArchitecturale.SANS_INTERET,
  qualitePaysage: QualitePaysage.ORDINAIRE,
  qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
  trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME,
  presenceEspecesProtegees: PresenceEspecesProtegees.NON,
  presenceZoneHumide: PresenceZoneHumide.NON,
};

/**
 * Non-régression : payload transmis par un partenaire intégrateur pour un appel en échec
 * du 28/07/2026 (parcelle 49353000AV0202, Trélazé). Il omet trois champs requis, ce qui
 * produisait une erreur 500 générique au lieu d'un 400 nommant les champs.
 *
 * Bloc d'enrichissement réduit aux champs utiles au test ; complémentaires laissés tels quels.
 */
export const DONNEES_COMPLEMENTAIRES_PARTENAIRE_INCOMPLETES = {
  typeProprietaire: "prive",
  raccordementEau: "oui",
  etatBatiInfrastructure: "degradation-heterogene",
  presencePollution: "ne-sait-pas",
  valeurArchitecturaleHistorique: "interet-remarquable",
  qualitePaysage: "ordinaire",
  qualiteVoieDesserte: "accessible",
} as unknown as DonneesComplementairesInputDto;

export const CHAMPS_MANQUANTS_PAYLOAD_PARTENAIRE = [
  "trameVerteEtBleue",
  "presenceEspecesProtegees",
  "presenceZoneHumide",
];

export const DONNEES_ENRICHIES_PARTENAIRE = {
  identifiantParcelle: "49353000AV0202",
  codeInsee: "49353",
  commune: "Trélazé",
  surfaceSite: 601,
  surfaceBati: 164,
  siteEnCentreVille: true,
  distanceAutoroute: 277,
  distanceTransportCommun: 115,
  proximiteCommercesServices: true,
  distanceRaccordementElectrique: 32.3274,
  tauxLogementsVacants: 5.1,
  presenceRisquesTechnologiques: true,
  risqueRetraitGonflementArgile: "faible-ou-moyen",
  risqueCavitesSouterraines: "oui",
  risqueInondation: "oui",
  zonageEnvironnemental: "hors-zone",
  zonageReglementaire: "zone-urbaine-u-habitat",
  zonagePatrimonial: "non-concerne",
  zoneAccelerationEnr: "oui",
  distanceIte: "plus-1km",
  distanceIteMetres: 1127,
  coordonnees: { latitude: 47.4457, longitude: -0.4732 },
  sourcesUtilisees: ["Cadastre", "BDNB"],
  champsManquants: ["zonageAbcLogement"],
  sourcesEchouees: ["ZonageABC-Logement", "GeoRisques-PPR"],
} as unknown as EnrichissementOutputDto;
