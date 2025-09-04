import { UsageType } from "@mutafriches/shared-types";
import {
  TypeProprietaire,
  EtatBati,
  PresencePollution,
  QualiteVoieDesserte,
  QualitePaysage,
  ValeurArchitecturale,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  ZonageReglementaire,
  CouvertVegetal,
  PresenceEspeceProtegee,
  ZoneHumide,
  VoieEauProximite,
} from "@mutafriches/shared-types";
import { ScoreImpact } from "../../../enums/score-impact.enum";

export type ScoreParUsage = {
  [key in UsageType]: number;
};

// Configuration des poids
export const POIDS_CRITERES = {
  typeProprietaire: 1,
  surfaceSite: 2,
  surfaceBati: 2,
  etatBatiInfrastructure: 2,
  presencePollution: 2,
  siteEnCentreVille: 2,
  tauxLogementsVacants: 1,
  terrainViabilise: 1,
  qualiteVoieDesserte: 0.5,
  distanceAutoroute: 0.5,
  distanceTransportCommun: 0.5,
  proximiteCommercesServices: 1,
  distanceRaccordementElectrique: 1,
  zonageReglementaire: 1,
  presenceRisquesNaturels: 1,
  presenceRisquesTechnologiques: 1,
  zonagePatrimonial: 1,
  qualitePaysage: 1,
  valeurArchitecturaleHistorique: 1,
  zonageEnvironnemental: 1,
  trameVerteEtBleue: 1,

  // critères non pris en compte dans la version web
  terrainEnPente: 1,
  voieEauProximite: 0.5,
  couvertVegetal: 1,
  presenceEspeceProtegee: 1,
  zoneHumide: 1,
} as const;

// Matrice de scoring complète avec ScoreImpact
export const MATRICE_SCORING = {
  // 1. Type de propriétaire
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
  },

  // 4. État du bâti
  etatBatiInfrastructure: {
    [EtatBati.PAS_DE_BATI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
    [EtatBati.EN_RUINE_DANGEREUX]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [EtatBati.FORTE_DEGRADATION]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
    [EtatBati.ETAT_MOYEN]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [EtatBati.BON_ETAT_APPARENT]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [EtatBati.ETAT_REMARQUABLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [EtatBati.BATIMENTS_HETEROGENES]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
  },

  // 5. Présence de pollution
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
  },

  // 7. En centre-ville ou centre-bourg
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
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
  },

  // 9. Terrain viabilisé (réseau eaux)
  terrainViabilise: {
    true: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_POSITIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    false: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.POSITIF,
    },
  },

  // 10. Qualité voie desserte
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
  },

  // 13. Commerces / services à proximité
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

  // 16. Zonage du PLU
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
    [ZonageReglementaire.ZONE_ACCELERATION_ENR]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_POSITIF,
    },
    [ZonageReglementaire.ZONE_MIXTE_MULTIPLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [ZonageReglementaire.CONSTRUCTIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.POSITIF,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
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

  // 17. Risque naturel
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

  // 18. Risque technologique
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

  // 19. Monument historique
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

  // 20. Paysage
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
  },

  // 21. Valeur architecturale
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
  },

  // 24. Zonage environnemental
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

  // 25. Trame verte et bleue
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
  },

  // Critère non pris en compte dans la version web
  // 6. Terrain en pente
  terrainEnPente: {
    true: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
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

  // Critère non pris en compte dans la version web
  // 14. Voie d'eau à proximité
  voieEauProximite: {
    [VoieEauProximite.OUI_NAVIGABLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [VoieEauProximite.OUI_NON_NAVIGABLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [VoieEauProximite.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Critère non pris en compte dans la version web
  // 22. Couvert végétal
  couvertVegetal: {
    [CouvertVegetal.IMPERMEABILISE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.POSITIF,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [CouvertVegetal.SOL_NU_FAIBLEMENT_HERBACE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
    [CouvertVegetal.VEGETATION_ARBUSTIVE_FAIBLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [CouvertVegetal.VEGETATION_ARBUSTIVE_PREDOMINANTE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
  },

  // Critère non pris en compte dans la version web
  // 23. Présence d'une espèce protégée
  presenceEspeceProtegee: {
    [PresenceEspeceProtegee.OUI]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [PresenceEspeceProtegee.NON]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
      [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
    },
  },

  // Critère non pris en compte dans la version web
  // 26. Zones humides
  zoneHumide: {
    [ZoneHumide.PRESENCE_AVEREE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.TRES_NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.TRES_NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.TRES_NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.TRES_POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.TRES_NEGATIF,
    },
    [ZoneHumide.PRESENCE_POTENTIELLE]: {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEGATIF,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEGATIF,
      [UsageType.CULTURE]: ScoreImpact.NEGATIF,
      [UsageType.TERTIAIRE]: ScoreImpact.NEGATIF,
      [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
      [UsageType.RENATURATION]: ScoreImpact.POSITIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    },
    [ZoneHumide.ABSENCE]: {
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
  surfaceSite: (value: number): ScoreParUsage => {
    if (value < 10000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
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

  surfaceBati: (value: number | undefined): ScoreParUsage => {
    if (!value || value < 10000)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEGATIF,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    return {
      [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
      [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
      [UsageType.CULTURE]: ScoreImpact.NEUTRE,
      [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
      [UsageType.INDUSTRIE]: ScoreImpact.POSITIF,
      [UsageType.RENATURATION]: ScoreImpact.NEGATIF,
      [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEGATIF,
    };
  },

  tauxLogementsVacants: (value: number): ScoreParUsage => {
    if (value <= 4)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.TRES_POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    if (value <= 6)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    if (value <= 10)
      return {
        [UsageType.RESIDENTIEL]: ScoreImpact.NEUTRE,
        [UsageType.EQUIPEMENTS]: ScoreImpact.NEUTRE,
        [UsageType.CULTURE]: ScoreImpact.NEUTRE,
        [UsageType.TERTIAIRE]: ScoreImpact.NEUTRE,
        [UsageType.INDUSTRIE]: ScoreImpact.NEUTRE,
        [UsageType.RENATURATION]: ScoreImpact.NEUTRE,
        [UsageType.PHOTOVOLTAIQUE]: ScoreImpact.NEUTRE,
      };
    if (value <= 13)
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

  distanceTransportCommun: (value: number): ScoreParUsage => {
    return value < 500
      ? {
          [UsageType.RESIDENTIEL]: ScoreImpact.POSITIF,
          [UsageType.EQUIPEMENTS]: ScoreImpact.POSITIF,
          [UsageType.CULTURE]: ScoreImpact.NEUTRE,
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

// Configuration des niveaux de fiabilité
export const NIVEAUX_FIABILITE = [
  {
    seuilMin: 9,
    text: "Très fiable",
    description: "Analyse complète avec toutes les données disponibles.",
  },
  {
    seuilMin: 7,
    text: "Fiable",
    description: "Données analysées avec un niveau de confiance élevé.",
  },
  {
    seuilMin: 5,
    text: "Moyennement fiable",
    description: "Analyse partielle, certaines données manquantes.",
  },
  {
    seuilMin: 3,
    text: "Peu fiable",
    description: "Données insuffisantes pour une analyse complète.",
  },
  {
    seuilMin: 0,
    text: "Très peu fiable",
    description: "Données très incomplètes, résultats indicatifs uniquement.",
  },
] as const;

// Export du nombre de critères mappés
export const NOMBRE_CRITERES_MAPPES = 26;

// Liste des critères actuellement utilisés en production
export const CRITERES_ACTIFS = 21;
