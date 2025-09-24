import {
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonageReglementaire,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from "../../enums";

/**
 * Mapping direct des valeurs Excel vers les enums de l'algorithme
 * Basé sur les vraies valeurs de l'onglet "Base" du fichier Excel v1.0
 */

// État du bâti - Valeurs exactes de l'Excel
export const ETAT_BATI_MAPPING: Record<string, EtatBatiInfrastructure> = {
  "Bon état": EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
  "Dégradation moyenne": EtatBatiInfrastructure.DEGRADATION_MOYENNE,
  "Dégradation très importante": EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
  "dégradation très importante": EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE, // Variante minuscule

  "Dégradation hétérogène": EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
  "Absence de bâtiments": EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
  "Ne sait pas": EtatBatiInfrastructure.NE_SAIT_PAS,
};

// Type propriétaire
export const TYPE_PROPRIETAIRE_MAPPING: Record<string, TypeProprietaire> = {
  Public: TypeProprietaire.PUBLIC,
  Privé: TypeProprietaire.PRIVE,
  Mixte: TypeProprietaire.MIXTE,
  "Copropriété ou indivision": TypeProprietaire.COPRO_INDIVISION,
  "Ne sait pas": TypeProprietaire.NE_SAIT_PAS,
};

// Terrain viabilisé (booléen dans l'Excel)
export const TERRAIN_VIABILISE_MAPPING: Record<string, TerrainViabilise> = {
  Oui: TerrainViabilise.OUI,
  Non: TerrainViabilise.NON,
  "Ne sait pas": TerrainViabilise.NE_SAIT_PAS,
};

// Présence pollution - Valeurs exactes de l'Excel
export const PRESENCE_POLLUTION_MAPPING: Record<string, PresencePollution> = {
  Non: PresencePollution.NON,
  "Oui - autres composés": PresencePollution.OUI_AUTRES_COMPOSES,
  "Oui - composés volatils": PresencePollution.OUI_COMPOSES_VOLATILS,
  "Déjà gérée": PresencePollution.DEJA_GEREE,
  "Ne sait pas": PresencePollution.NE_SAIT_PAS,
};

// Valeur architecturale - Valeurs exactes
export const VALEUR_ARCHITECTURALE_MAPPING: Record<string, ValeurArchitecturale> = {
  "Sans intérêt": ValeurArchitecturale.SANS_INTERET,
  "Banal / infra-ordinaire": ValeurArchitecturale.BANAL_INFRA_ORDINAIRE,
  Ordinaire: ValeurArchitecturale.ORDINAIRE,
  "Intérêt fort": ValeurArchitecturale.INTERET_FORT,
  Exceptionnel: ValeurArchitecturale.EXCEPTIONNEL,
  "Ne sait pas": ValeurArchitecturale.NE_SAIT_PAS,
};

// Qualité paysage - Valeurs exactes
export const QUALITE_PAYSAGE_MAPPING: Record<string, QualitePaysage> = {
  Dégradé: QualitePaysage.DEGRADE,
  "Banal / infra-ordinaire": QualitePaysage.BANAL_INFRA_ORDINAIRE,
  "Quotidien / ordinaire": QualitePaysage.QUOTIDIEN_ORDINAIRE,
  Intéressant: QualitePaysage.INTERESSANT,
  Remarquable: QualitePaysage.REMARQUABLE,
  "Ne sait pas": QualitePaysage.NE_SAIT_PAS,
};

// Qualité voie desserte - Valeurs exactes
export const QUALITE_VOIE_DESSERTE_MAPPING: Record<string, QualiteVoieDesserte> = {
  Accessible: QualiteVoieDesserte.ACCESSIBLE,
  "Peu accessible": QualiteVoieDesserte.PEU_ACCESSIBLE,
  Dégradée: QualiteVoieDesserte.DEGRADEE,
  "Ne sait pas": QualiteVoieDesserte.NE_SAIT_PAS,
};

// Risque naturel - Valeurs exactes
export const RISQUE_NATUREL_MAPPING: Record<string, RisqueNaturel> = {
  Aucun: RisqueNaturel.AUCUN,
  Faible: RisqueNaturel.FAIBLE,
  Moyen: RisqueNaturel.MOYEN,
  Fort: RisqueNaturel.FORT,
};

// Zonage environnemental - Valeurs exactes
export const ZONAGE_ENVIRONNEMENTAL_MAPPING: Record<string, ZonageEnvironnemental> = {
  "Hors zone": ZonageEnvironnemental.HORS_ZONE,
  "Natura 2000": ZonageEnvironnemental.NATURA_2000,
  "ZNIEFF type 1 ou 2": ZonageEnvironnemental.ZNIEFF_TYPE_1_2,
  "ZNIEFF 1 ou 2": ZonageEnvironnemental.ZNIEFF_TYPE_1_2, // Variante courante
  "Parc naturel régional": ZonageEnvironnemental.PARC_NATUREL_REGIONAL,
  "Parc naturel national": ZonageEnvironnemental.PARC_NATUREL_NATIONAL,
  "Réserve naturelle": ZonageEnvironnemental.RESERVE_NATURELLE,
  "Proximité zone protégée": ZonageEnvironnemental.PROXIMITE_ZONE,
};

// Zonage réglementaire - Valeurs EXACTES de l'Excel
export const ZONAGE_REGLEMENTAIRE_MAPPING: Record<string, ZonageReglementaire> = {
  "Zone urbaine": ZonageReglementaire.ZONE_URBAINE_U,
  "Zone urbaine – U": ZonageReglementaire.ZONE_URBAINE_U, // Variante avec tiret

  "Zone urbaine hors zone d'accélération ENR": ZonageReglementaire.ZONE_URBAINE_U,
  "Zone urbaine en zone d'accélération ENR": ZonageReglementaire.ZONE_URBAINE_U,

  "Zone à urbaniser": ZonageReglementaire.ZONE_A_URBANISER_AU,
  "Zone à urbaniser hors zone d'accélération ENR": ZonageReglementaire.ZONE_A_URBANISER_AU,
  "Zone à urbaniser en zone d'accélération ENR": ZonageReglementaire.ZONE_A_URBANISER_AU,

  "Zone d'activités": ZonageReglementaire.ZONE_ACTIVITES,
  "Zone d'activités hors zone d'accélération ENR": ZonageReglementaire.ZONE_ACTIVITES,
  "Zone d'activités en zone d'accélération ENR": ZonageReglementaire.ZONE_ACTIVITES,

  "Zone naturelle": ZonageReglementaire.ZONE_NATURELLE,
  "Zone naturelle hors zone d'accélération ENR": ZonageReglementaire.ZONE_NATURELLE,
  "Zone naturelle en zone d'accélération ENR": ZonageReglementaire.ZONE_NATURELLE,

  "Zone agricole": ZonageReglementaire.ZONE_AGRICOLE,
  "Zone agricole hors zone d'accélération ENR": ZonageReglementaire.ZONE_AGRICOLE,
  "Zone agricole en zone d'accélération ENR": ZonageReglementaire.ZONE_AGRICOLE,

  Constructible: ZonageReglementaire.CONSTRUCTIBLE,
  "Non constructible": ZonageReglementaire.NON_CONSTRUCTIBLE,
};

// Zonage patrimonial - Valeurs exactes
export const ZONAGE_PATRIMONIAL_MAPPING: Record<string, ZonagePatrimonial> = {
  "Non concerné": ZonagePatrimonial.NON_CONCERNE,
  "Monument historique": ZonagePatrimonial.MONUMENT_HISTORIQUE,
  "Site inscrit ou classé": ZonagePatrimonial.SITE_INSCRIT_CLASSE,
  "Périmètre ABF": ZonagePatrimonial.PERIMETRE_ABF,
  ZPPAUP: ZonagePatrimonial.ZPPAUP,
  AVAP: ZonagePatrimonial.AVAP,
  "SPR (site patrimonial remarquable)": ZonagePatrimonial.SPR,
};

// Trame verte et bleue - Valeurs exactes
export const TRAME_VERTE_BLEUE_MAPPING: Record<string, TrameVerteEtBleue> = {
  "Hors trame": TrameVerteEtBleue.HORS_TRAME,
  "Réservoir de biodiversité": TrameVerteEtBleue.RESERVOIR_BIODIVERSITE,
  "Corridor à restaurer": TrameVerteEtBleue.CORRIDOR_A_RESTAURER,
  "Corridor à préserver": TrameVerteEtBleue.CORRIDOR_A_PRESERVER,
  "Ne sait pas": TrameVerteEtBleue.NE_SAIT_PAS,
};

// Distances - Valeurs exactes
export const DISTANCE_AUTOROUTE_MAPPING: Record<string, string> = {
  "Moins de 1 km": "moins-de-1km",
  "Entre 1 et 2 km": "entre-1-et-2km",
  "Entre 2 et 5 km": "entre-2-et-5km",
  "Plus de 5km": "plus-de-5km", // Variante sans espace
  "Plus de 5 km": "plus-de-5km",
};

export const DISTANCE_TRANSPORT_MAPPING: Record<string, string> = {
  "Moins de 500 m": "moins-de-500m",
  "Plus de 500 m": "plus-de-500m",
  "Plus de 500m": "plus-de-500m", // Variante sans espace
};

export const DISTANCE_ELECTRIQUE_MAPPING: Record<string, string> = {
  "Moins de 1 km": "moins-de-1km",
  "Entre 1 et 5 km": "entre-1-et-5km",
  "Entre 1 et 5km": "entre-1-et-5km", // Variante sans espace
  "Plus de 5 km": "plus-de-5km",
};
