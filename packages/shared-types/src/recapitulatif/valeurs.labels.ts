import {
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageEnvironnemental,
  ZonageReglementaire,
  ZonagePatrimonial,
  ZonageAbcLogement,
  ZoneAccelerationEnr,
  TrameVerteEtBleue,
  SourceEnrichissement,
} from "../enrichissement";
import {
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  PresenceEspecesProtegees,
  PresenceZoneHumide,
} from "../evaluation/enums";

/** Valeur affichée lorsqu'un critère n'est pas renseigné */
export const VALEUR_NON_DISPONIBLE = "Non disponible";

// ------------------------------------------------------------------
// Formatters de valeurs numériques (purs, locale fr-FR)
// ------------------------------------------------------------------

/** Formate une surface en m² (séparateur de milliers français), toujours en m² */
export function formatSurface(m2: number | null | undefined): string {
  if (m2 === null || m2 === undefined) return VALEUR_NON_DISPONIBLE;
  return `${Math.round(m2).toLocaleString("fr-FR")} m²`;
}

/** Formate une distance en mètres (km au-delà de 1000 m) */
export function formatDistance(metres: number | null | undefined): string {
  if (metres === null || metres === undefined) return VALEUR_NON_DISPONIBLE;
  if (metres >= 1000) {
    return `${(metres / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
  }
  return `${Math.round(metres)} m`;
}

/** Formate un booléen en Oui / Non */
export function formatBooleen(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return VALEUR_NON_DISPONIBLE;
  return value ? "Oui" : "Non";
}

/** Formate un pourcentage (max 2 décimales, locale fr-FR) */
export function formatPourcentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return VALEUR_NON_DISPONIBLE;
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

/** Résout le libellé d'une valeur enum, ou "Non disponible" si absente/inconnue */
export function libelleEnum<T extends string>(
  map: Record<T, string>,
  value: T | null | undefined,
): string {
  if (value === null || value === undefined) return VALEUR_NON_DISPONIBLE;
  return map[value] ?? VALEUR_NON_DISPONIBLE;
}

// ------------------------------------------------------------------
// Libellés des valeurs — critères saisis manuellement
// ------------------------------------------------------------------

export const TYPE_PROPRIETAIRE_LABELS: Record<TypeProprietaire, string> = {
  [TypeProprietaire.PUBLIC]: "Public",
  [TypeProprietaire.PRIVE]: "Privé",
  [TypeProprietaire.MIXTE]: "Mixte public et privé",
  [TypeProprietaire.COPRO_INDIVISION]: "Copropriété / Indivision",
  [TypeProprietaire.NE_SAIT_PAS]: "Ne sait pas",
};

export const RACCORDEMENT_EAU_LABELS: Record<RaccordementEau, string> = {
  [RaccordementEau.OUI]: "Oui",
  [RaccordementEau.NON]: "Non",
  [RaccordementEau.NE_SAIT_PAS]: "Ne sait pas",
};

export const ETAT_BATI_LABELS: Record<EtatBatiInfrastructure, string> = {
  [EtatBatiInfrastructure.DEGRADATION_INEXISTANTE]: "Dégradation inexistante ou faible",
  [EtatBatiInfrastructure.DEGRADATION_MOYENNE]: "Dégradation moyenne",
  [EtatBatiInfrastructure.DEGRADATION_HETEROGENE]: "Dégradation hétérogène",
  [EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE]: "Dégradation très importante",
  [EtatBatiInfrastructure.PAS_DE_BATI]: "Pas de bâti",
  [EtatBatiInfrastructure.NE_SAIT_PAS]: "Ne sait pas",
};

export const PRESENCE_POLLUTION_LABELS: Record<PresencePollution, string> = {
  [PresencePollution.NON]: "Non",
  [PresencePollution.DEJA_GEREE]: "Déjà gérée",
  [PresencePollution.OUI_COMPOSES_VOLATILS]: "Oui - composés volatils",
  [PresencePollution.OUI_AMIANTE]: "Oui - amiante",
  [PresencePollution.OUI_AUTRES_COMPOSES]: "Oui - autres composés",
  [PresencePollution.NE_SAIT_PAS]: "Ne sait pas",
};

export const VALEUR_ARCHITECTURALE_LABELS: Record<ValeurArchitecturale, string> = {
  [ValeurArchitecturale.SANS_INTERET]: "Sans intérêt",
  [ValeurArchitecturale.ORDINAIRE]: "Ordinaire",
  [ValeurArchitecturale.INTERET_REMARQUABLE]: "Intérêt remarquable",
  [ValeurArchitecturale.PAS_DE_BATI]: "Pas de bâti",
  [ValeurArchitecturale.NE_SAIT_PAS]: "Ne sait pas",
};

export const QUALITE_PAYSAGE_LABELS: Record<QualitePaysage, string> = {
  [QualitePaysage.SANS_INTERET]: "Sans intérêt",
  [QualitePaysage.ORDINAIRE]: "Ordinaire",
  [QualitePaysage.INTERET_REMARQUABLE]: "Intérêt remarquable",
  [QualitePaysage.NE_SAIT_PAS]: "Ne sait pas",
};

export const QUALITE_VOIE_LABELS: Record<QualiteVoieDesserte, string> = {
  [QualiteVoieDesserte.ACCESSIBLE]: "Accessible",
  [QualiteVoieDesserte.PEU_ACCESSIBLE]: "Peu accessible",
  [QualiteVoieDesserte.DEGRADEE]: "Dégradée",
  [QualiteVoieDesserte.NE_SAIT_PAS]: "Ne sait pas",
};

export const TRAME_VERTE_BLEUE_LABELS: Record<TrameVerteEtBleue, string> = {
  [TrameVerteEtBleue.HORS_TRAME]: "Hors trame",
  [TrameVerteEtBleue.RESERVOIR_BIODIVERSITE]: "Réservoir de biodiversité",
  [TrameVerteEtBleue.CORRIDOR_A_PRESERVER]: "Corridor à préserver",
  [TrameVerteEtBleue.CORRIDOR_A_RESTAURER]: "Corridor à restaurer",
  [TrameVerteEtBleue.NE_SAIT_PAS]: "Ne sait pas",
};

export const PRESENCE_ESPECES_LABELS: Record<PresenceEspecesProtegees, string> = {
  [PresenceEspecesProtegees.OUI]: "Oui",
  [PresenceEspecesProtegees.NON]: "Non",
  [PresenceEspecesProtegees.NE_SAIT_PAS]: "Ne sait pas",
};

export const PRESENCE_ZONE_HUMIDE_LABELS: Record<PresenceZoneHumide, string> = {
  [PresenceZoneHumide.OUI]: "Oui",
  [PresenceZoneHumide.NON]: "Non",
  [PresenceZoneHumide.NE_SAIT_PAS]: "Ne sait pas",
};

// ------------------------------------------------------------------
// Libellés des valeurs — critères enrichis automatiquement
// ------------------------------------------------------------------

export const RGA_LABELS: Record<RisqueRetraitGonflementArgile, string> = {
  [RisqueRetraitGonflementArgile.AUCUN]: "Aucun",
  [RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN]: "Faible ou moyen",
  [RisqueRetraitGonflementArgile.FORT]: "Fort",
};

export const CAVITES_LABELS: Record<RisqueCavitesSouterraines, string> = {
  [RisqueCavitesSouterraines.NON]: "Non",
  [RisqueCavitesSouterraines.OUI]: "Oui",
};

export const INONDATION_LABELS: Record<RisqueInondation, string> = {
  [RisqueInondation.NON]: "Non",
  [RisqueInondation.OUI]: "Oui",
};

export const ZONAGE_ENVIRONNEMENTAL_LABELS: Record<ZonageEnvironnemental, string> = {
  [ZonageEnvironnemental.HORS_ZONE]: "Hors zone",
  [ZonageEnvironnemental.NATURA_2000]: "Natura 2000",
  [ZonageEnvironnemental.ZNIEFF_TYPE_1_2]: "ZNIEFF type 1 / 2",
  [ZonageEnvironnemental.PARC_NATUREL_REGIONAL]: "Parc naturel régional",
  [ZonageEnvironnemental.PARC_NATUREL_NATIONAL]: "Parc naturel national",
  [ZonageEnvironnemental.RESERVE_NATURELLE]: "Réserve naturelle",
  [ZonageEnvironnemental.PROXIMITE_ZONE]: "À proximité d'une zone protégée",
};

export const ZONAGE_REGLEMENTAIRE_LABELS: Record<ZonageReglementaire, string> = {
  [ZonageReglementaire.ZONE_URBAINE_U]: "Zone urbaine (U)",
  [ZonageReglementaire.ZONE_URBAINE_U_HABITAT]: "Zone urbaine - habitat",
  [ZonageReglementaire.ZONE_URBAINE_U_EQUIPEMENT]: "Zone urbaine - équipement",
  [ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE]: "Zone urbaine - activité",
  [ZonageReglementaire.ZONE_A_URBANISER_AU]: "Zone à urbaniser (AU)",
  [ZonageReglementaire.ZONE_VOCATION_ACTIVITES]: "Zone à vocation d'activités",
  [ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION]: "Secteur ouvert à la construction",
  [ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION]:
    "Secteur non ouvert à la construction",
  [ZonageReglementaire.SECTEUR_REGLEMENT_URBANISME]: "Secteur avec règlement d'urbanisme",
  [ZonageReglementaire.ZONE_AGRICOLE_A]: "Zone agricole (A)",
  [ZonageReglementaire.ZONE_NATURELLE_N]: "Zone naturelle (N)",
  [ZonageReglementaire.NE_SAIT_PAS]: "Ne sait pas",
};

export const ZONAGE_PATRIMONIAL_LABELS: Record<ZonagePatrimonial, string> = {
  [ZonagePatrimonial.NON_CONCERNE]: "Non concerné",
  [ZonagePatrimonial.MONUMENT_HISTORIQUE]: "Monument historique",
  [ZonagePatrimonial.SITE_INSCRIT_CLASSE]: "Site inscrit / classé",
  [ZonagePatrimonial.PERIMETRE_ABF]: "Périmètre ABF",
  [ZonagePatrimonial.ZPPAUP]: "ZPPAUP",
  [ZonagePatrimonial.AVAP]: "AVAP",
  [ZonagePatrimonial.SPR]: "Site patrimonial remarquable (SPR)",
};

export const ZONAGE_ABC_LOGEMENT_LABELS: Record<ZonageAbcLogement, string> = {
  [ZonageAbcLogement.ABIS]: "Zone A bis",
  [ZonageAbcLogement.A]: "Zone A",
  [ZonageAbcLogement.B1]: "Zone B1",
  [ZonageAbcLogement.B2]: "Zone B2",
  [ZonageAbcLogement.C]: "Zone C",
};

export const ZONE_ACCELERATION_ENR_LABELS: Record<ZoneAccelerationEnr, string> = {
  [ZoneAccelerationEnr.NON]: "Non",
  [ZoneAccelerationEnr.OUI]: "Oui",
  [ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE]: "Oui - PV ombrière",
};

// ------------------------------------------------------------------
// Libellés courts des sources (badge "Source")
// ------------------------------------------------------------------

export const SOURCE_LABELS: Partial<Record<SourceEnrichissement, string>> = {
  [SourceEnrichissement.CADASTRE]: "Cadastre",
  [SourceEnrichissement.BDNB_SURFACE_BATIE]: "BDNB",
  [SourceEnrichissement.ENEDIS_RACCORDEMENT]: "Enedis",
  [SourceEnrichissement.SERVICE_PUBLIC]: "API Service Public",
  [SourceEnrichissement.BPE]: "BPE (INSEE)",
  [SourceEnrichissement.LOVAC]: "LOVAC",
  [SourceEnrichissement.TRANSPORT_DATA_GOUV]: "Transport Data Gouv",
  [SourceEnrichissement.IGN_WFS]: "IGN",
  [SourceEnrichissement.GEORISQUES_ICPE]: "GéoRisques",
  [SourceEnrichissement.GEORISQUES_RGA]: "GéoRisques",
  [SourceEnrichissement.GEORISQUES_CAVITES]: "GéoRisques",
  [SourceEnrichissement.GEORISQUES_TRI]: "GéoRisques",
  [SourceEnrichissement.API_CARTO_NATURE]: "API Carto Nature",
  [SourceEnrichissement.API_CARTO_GPU]: "API Carto GPU",
  [SourceEnrichissement.ZAER]: "ZAER-ENR",
  [SourceEnrichissement.ZONAGE_ABC_LOGEMENT]: "Zonage ABC",
};
