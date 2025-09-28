import { EtatBatiInfrastructure, TerrainViabilise, UsageType } from "@mutafriches/shared-types";
import {
  TypeProprietaire,
  PresencePollution,
  QualiteVoieDesserte,
  QualitePaysage,
  ValeurArchitecturale,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  ZonageReglementaire,
} from "@mutafriches/shared-types";
import { ScoreParUsage } from "./algorithme.types";

// Version de l'algorithme
export const VERSION_ALGO = "1.1";

/**
 * Enum représentant les niveaux d'impact pour le calcul de mutabilité
 * Correspondance avec les valeurs Excel : Très négatif, Négatif, Neutre, Positif, Très positif
 */
export enum ScoreImpact {
  /** Très négatif - Impact très défavorable */
  TRES_NEGATIF = -2,

  /** Négatif - Impact défavorable */
  NEGATIF = -1,

  /** Neutre - Impact minimal */
  // Vu avec Anna, permet d'éviter le déclassement total d'un usage au regard du critère en question
  NEUTRE = 0.5,

  /** Positif - Impact favorable */
  POSITIF = 1,

  /** Très positif - Impact très favorable */
  TRES_POSITIF = 2,
}

// Configuration des poids
export const POIDS_CRITERES = {
  // Critères pris en compte dans la version web (vu le 19/09)
  // 14 Critères déduits module enrichissement
  surfaceSite: 2, // OK le 19/09 avec Anna
  surfaceBati: 2, // OK le 19/09 avec Anna, ajustement en v2 à prévoir
  siteEnCentreVille: 1, // OK le 19/09 avec Anna // Poids corrigé
  distanceAutoroute: 0.5, // OK le 19/09 avec Anna
  distanceTransportCommun: 1, // OK le 19/09 avec Anna // Poids corrigé
  proximiteCommercesServices: 1, // OK le 19/09 avec Anna
  distanceRaccordementElectrique: 1, // OK le 19/09 avec Anna
  tauxLogementsVacants: 1, // OK le 19/09 avec Anna
  presenceRisquesNaturels: 1, // OK le 19/09 avec Anna
  presenceRisquesTechnologiques: 1, // OK le 19/09 avec Anna
  zonageEnvironnemental: 1, // OK le 19/09 avec Anna
  zonageReglementaire: 1, // Vu en v1 mais TODO à revoir en V1.1 au niveau des options
  zonagePatrimonial: 1, // OK le 19/09 avec Anna
  trameVerteEtBleue: 1, // OK le 19/09 avec Anna

  // ------------------------------------------------
  // 7 critères déduis des données complémentaires
  // ------------------------------------------------
  typeProprietaire: 1, // OK le 19/09 avec Anna
  terrainViabilise: 1, // OK le 19/09 avec Anna
  etatBatiInfrastructure: 2, // OK le 19/09 avec Anna mais en attente de l'excel à jour coté Anna
  presencePollution: 2, // OK le 19/09 avec Anna
  valeurArchitecturaleHistorique: 1, // Vu en v1 mais TODO à revoir en V1.1 au niveau des options
  qualitePaysage: 1, // Vu en v1 mais TODO à revoir en V1.1 au niveau des options
  qualiteVoieDesserte: 0.5, // OK le 19/09 avec Anna = Accessibilité par les voies de circulation
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
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
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

  // Terrain viabilisé (Site connecté aux réseaux d'eaux)
  terrainViabilise: {
    [TerrainViabilise.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [TerrainViabilise.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [TerrainViabilise.NE_SAIT_PAS]: {
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
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
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
    [ZonageReglementaire.ZONE_URBAINE_U]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [ZonageReglementaire.ZONE_A_URBANISER_AU]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [ZonageReglementaire.ZONE_ACTIVITES]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [ZonageReglementaire.ZONE_NATURELLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [ZonageReglementaire.ZONE_AGRICOLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    // TODO à revoir completement en V1.1
    [ZonageReglementaire.ZONE_ACCELERATION_ENR]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
    // TODO à revoir completement en V1.1
    [ZonageReglementaire.ZONE_MIXTE_MULTIPLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    // TODO à revoir completement en V1.1
    [ZonageReglementaire.CONSTRUCTIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    // TODO à revoir completement en V1.1
    [ZonageReglementaire.NON_CONSTRUCTIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
  },

  // Risques naturels
  presenceRisquesNaturels: {
    [RisqueNaturel.FORT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [RisqueNaturel.MOYEN]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [RisqueNaturel.FAIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [RisqueNaturel.AUCUN]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Risques technologiques
  presenceRisquesTechnologiques: {
    true: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
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
    [QualitePaysage.DEGRADE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [QualitePaysage.BANAL_INFRA_ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [QualitePaysage.QUOTIDIEN_ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [QualitePaysage.INTERESSANT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [QualitePaysage.REMARQUABLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
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
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
    [ValeurArchitecturale.BANAL_INFRA_ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [ValeurArchitecturale.ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [ValeurArchitecturale.INTERET_FORT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [ValeurArchitecturale.EXCEPTIONNEL]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
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

  // Fonctions pour valeurs numériques

  // Surface du site en m²
  surfaceSite: (value: number): ScoreParUsage => {
    if (value < 10000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF, // Modifié le 18/09/2025 après revue avec Anna
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
      // TODO : optim
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
} as const;

// Export du nombre de critères utilisés dans le calcul
export const NOMBRE_CRITERES_UTILISES = Object.keys(POIDS_CRITERES).length;
