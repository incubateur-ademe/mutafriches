import { EtatBatiInfrastructure, RaccordementEau, UsageType } from "@mutafriches/shared-types";
import {
  TypeProprietaire,
  PresenceEspecesProtegees,
  PresencePollution,
  QualiteVoieDesserte,
  QualitePaysage,
  ValeurArchitecturale,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  ZonageReglementaire,
  ZoneAccelerationEnr,
} from "@mutafriches/shared-types";
import { ScoreImpact, ScoreParUsage } from "./algorithme.types";

// Configuration des poids
export const POIDS_CRITERES = {
  // Critères pris en compte dans la version web (vu le 19/09)
  // 14 Critères déduits module enrichissement
  surfaceSite: 2,
  surfaceBati: 2,
  siteEnCentreVille: 1,
  distanceAutoroute: 0.5,
  distanceTransportCommun: 1,
  proximiteCommercesServices: 1,
  distanceRaccordementElectrique: 1,
  tauxLogementsVacants: 1,
  risqueRetraitGonflementArgile: 0.5,
  risqueCavitesSouterraines: 0.5,
  risqueInondation: 1,
  presenceRisquesTechnologiques: 1,
  zonageEnvironnemental: 1,
  zonageReglementaire: 2,
  zonagePatrimonial: 1,
  trameVerteEtBleue: 1,
  zoneAccelerationEnr: 1,

  // ------------------------------------------------
  // 7 critères déduis des données complémentaires
  // ------------------------------------------------
  typeProprietaire: 1,
  raccordementEau: 1,
  etatBatiInfrastructure: 2,
  presencePollution: 2,
  valeurArchitecturaleHistorique: 1,
  qualitePaysage: 1,
  qualiteVoieDesserte: 0.5,
  presenceEspecesProtegees: 1,
} as const;

// Matrice de scoring complète avec ScoreImpact
export const MATRICE_SCORING = {
  // Type de propriétaire
  typeProprietaire: {
    [TypeProprietaire.PUBLIC]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [TypeProprietaire.PRIVE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [TypeProprietaire.COPRO_INDIVISION]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [TypeProprietaire.MIXTE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [TypeProprietaire.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // État du bâti
  etatBatiInfrastructure: {
    [EtatBatiInfrastructure.DEGRADATION_INEXISTANTE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
    [EtatBatiInfrastructure.DEGRADATION_MOYENNE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [EtatBatiInfrastructure.DEGRADATION_HETEROGENE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },

    [EtatBatiInfrastructure.PAS_DE_BATI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
    [EtatBatiInfrastructure.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Présence de pollution
  presencePollution: {
    [PresencePollution.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [PresencePollution.DEJA_GEREE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [PresencePollution.OUI_COMPOSES_VOLATILS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [PresencePollution.OUI_AUTRES_COMPOSES]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [PresencePollution.OUI_AMIANTE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [PresencePollution.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // En centre-ville ou centre-bourg
  siteEnCentreVille: {
    true: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    false: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
  },

  // Raccordement à l'eau
  raccordementEau: {
    [RaccordementEau.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RaccordementEau.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RaccordementEau.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Qualité voie desserte
  qualiteVoieDesserte: {
    [QualiteVoieDesserte.ACCESSIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [QualiteVoieDesserte.DEGRADEE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [QualiteVoieDesserte.PEU_ACCESSIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [QualiteVoieDesserte.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Commerces / services à proximité
  proximiteCommercesServices: {
    true: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    false: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Zonage du PLU
  zonageReglementaire: {
    // Zone urbaine U générique (catch-all pour U simple ou sous-zones non classifiées)
    [ZonageReglementaire.ZONE_URBAINE_U]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },

    // Zone urbaine U habitat (UA, UB, UC, UD)
    [ZonageReglementaire.ZONE_URBAINE_U_HABITAT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },

    // Zone urbaine U équipement (UE)
    [ZonageReglementaire.ZONE_URBAINE_U_EQUIPEMENT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },

    // Zone urbaine U activité (UI, UX, UY, UZ)
    [ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },

    [ZonageReglementaire.ZONE_A_URBANISER_AU]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },

    [ZonageReglementaire.ZONE_VOCATION_ACTIVITES]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },

    [ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },

    [ZonageReglementaire.SECTEUR_REGLEMENT_URBANISME]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },

    [ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },

    [ZonageReglementaire.ZONE_AGRICOLE_A]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },

    [ZonageReglementaire.ZONE_NATURELLE_N]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },

    [ZonageReglementaire.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Retrait gonflement argile (RGA)
  risqueRetraitGonflementArgile: {
    [RisqueRetraitGonflementArgile.AUCUN]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RisqueRetraitGonflementArgile.FORT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Cavités souterraines
  risqueCavitesSouterraines: {
    [RisqueCavitesSouterraines.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RisqueCavitesSouterraines.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Inondations
  risqueInondation: {
    [RisqueInondation.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RisqueInondation.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
  },

  // Risques technologiques
  presenceRisquesTechnologiques: {
    true: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    false: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Zonage patrimonial / Monument historique
  zonagePatrimonial: {
    [ZonagePatrimonial.NON_CONCERNE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [ZonagePatrimonial.SITE_INSCRIT_CLASSE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [ZonagePatrimonial.PERIMETRE_ABF]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
  },

  // Qualité paysage
  qualitePaysage: {
    [QualitePaysage.SANS_INTERET]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },

    [QualitePaysage.ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },

    [QualitePaysage.INTERET_REMARQUABLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },

    [QualitePaysage.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Valeur architecturale
  valeurArchitecturaleHistorique: {
    [ValeurArchitecturale.SANS_INTERET]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },

    [ValeurArchitecturale.ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },

    [ValeurArchitecturale.INTERET_REMARQUABLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },

    [ValeurArchitecturale.PAS_DE_BATI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },

    [ValeurArchitecturale.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Zonage environnemental
  zonageEnvironnemental: {
    [ZonageEnvironnemental.HORS_ZONE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [ZonageEnvironnemental.RESERVE_NATURELLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [ZonageEnvironnemental.NATURA_2000]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [ZonageEnvironnemental.ZNIEFF_TYPE_1_2]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [ZonageEnvironnemental.PROXIMITE_ZONE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Trame verte et bleue
  trameVerteEtBleue: {
    [TrameVerteEtBleue.HORS_TRAME]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [TrameVerteEtBleue.RESERVOIR_BIODIVERSITE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [TrameVerteEtBleue.CORRIDOR_A_PRESERVER]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [TrameVerteEtBleue.CORRIDOR_A_RESTAURER]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [TrameVerteEtBleue.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Présence d'espèces protégées
  presenceEspecesProtegees: {
    [PresenceEspecesProtegees.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [PresenceEspecesProtegees.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [PresenceEspecesProtegees.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Fonctions pour valeurs numériques

  // Surface du site en m²
  surfaceSite: (value: number): ScoreParUsage => {
    if (value < 10000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
      };
    if (value < 15000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
      };
    if (value <= 50000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
        [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
      };
    return {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    };
  },

  // Surface bâtie en m²
  surfaceBati: (value: number | undefined): ScoreParUsage => {
    if (!value || value < 5000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
        [UsageType.RENATURATION]: ScoreImpact.POSITIF,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
      };
    if (value >= 5000 && value <= 10000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    return {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    };
  },

  // Taux de logements vacants en %
  // Modifié le 18/09/2024 après revue avec Anna
  tauxLogementsVacants: (value: number): ScoreParUsage => {
    if (value <= 7)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    if (value <= 8 && value > 7)
      // Modifié le 18/09/2024 après revue avec Anna
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    if (value <= 10 && value > 8)
      // Modifié le 18/09/2024 après revue avec Anna
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    return {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    };
  },

  // Distances en km et m
  distanceAutoroute: (value: number): ScoreParUsage => {
    if (value < 1)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
      };
    if (value < 2)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
      };
    if (value < 5)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
      };
    return {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    };
  },

  // Distance aux transports en commun en mètres
  distanceTransportCommun: (value: number): ScoreParUsage => {
    return value < 500
      ? {
          [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
          [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
          [UsageType.CULTURE]: ScoreImpact.POSITIF, // Modifié le 18/09/2025 après revue avec Anna
          [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
          [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
          [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
          [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
        }
      : {
          [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
          [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
          [UsageType.CULTURE]: ScoreImpact.NEUTRE,
          [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
          [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
          [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
          [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
        };
  },

  // Distance au réseau électrique en km
  distanceRaccordementElectrique: (value: number): ScoreParUsage => {
    if (value < 1)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    if (value < 5)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
      };
    return {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    };
  },

  // Zone d'accélération des énergies renouvelables (ZAER)
  zoneAccelerationEnr: {
    [ZoneAccelerationEnr.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [ZoneAccelerationEnr.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
  },
} as const;
