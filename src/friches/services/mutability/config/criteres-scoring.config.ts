import { UsageType } from '../../../enums/mutability.enums';
import {
  TypeProprietaire,
  PresencePollution,
  EtatBati,
  ReseauEaux,
  QualiteDesserte,
  RisqueNaturel,
  ZonagePatrimonial,
  QualitePaysage,
  ValeurArchitecturale,
  ZonageEnvironnemental,
  TrameVerteEtBleue,
  ZonageReglementaire,
} from '../../../enums/parcelle.enums';

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
  reseauEaux: 1,
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
} as const;

// Matrice de scoring complète
export const MATRICE_SCORING = {
  // 1. Type de propriétaire
  typeProprietaire: {
    [TypeProprietaire.PUBLIC]: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [TypeProprietaire.PRIVE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [TypeProprietaire.COPRO_INDIVISION]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [TypeProprietaire.MIXTE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
  },

  // 4. État du bâti
  etatBatiInfrastructure: {
    [EtatBati.PAS_DE_BATI]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: 2,
    },
    [EtatBati.EN_RUINE_DANGEREUX]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: -2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [EtatBati.FORTE_DEGRADATION]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [EtatBati.ETAT_MOYEN]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [EtatBati.BON_ETAT_APPARENT]: {
      [UsageType.RESIDENTIEL]: 1,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: -1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [EtatBati.ETAT_REMARQUABLE]: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: 2,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
    [EtatBati.BATIMENTS_HETEROGENES]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: -1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
  },

  // 5. Présence de pollution
  presencePollution: {
    [PresencePollution.NON]: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: 2,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [PresencePollution.DEJA_GEREE]: {
      [UsageType.RESIDENTIEL]: 1,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [PresencePollution.OUI_COMPOSES_VOLATILS]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: -2,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [PresencePollution.OUI_AUTRES_COMPOSES]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [PresencePollution.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: 0,
      [UsageType.EQUIPEMENTS]: 0,
      [UsageType.CULTURE]: 0,
      [UsageType.TERTIAIRE]: 0,
      [UsageType.INDUSTRIE]: 0,
      [UsageType.RENATURATION]: 0,
      [UsageType.PHOTOVOLTAIQUE]: 0,
    },
  },

  // 9. Terrain viabilisé (réseau eaux)
  reseauEaux: {
    [ReseauEaux.OUI]: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: 2,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [ReseauEaux.NON]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: -2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [ReseauEaux.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: 0,
      [UsageType.EQUIPEMENTS]: 0,
      [UsageType.CULTURE]: 0,
      [UsageType.TERTIAIRE]: 0,
      [UsageType.INDUSTRIE]: 0,
      [UsageType.RENATURATION]: 0,
      [UsageType.PHOTOVOLTAIQUE]: 0,
    },
  },

  // 10. Qualité voie desserte
  qualiteVoieDesserte: {
    [QualiteDesserte.ACCESSIBLE]: {
      [UsageType.RESIDENTIEL]: 1,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [QualiteDesserte.DEGRADEE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [QualiteDesserte.PEU_ACCESSIBLE]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [QualiteDesserte.NE_SAIT_PAS]: {
      [UsageType.RESIDENTIEL]: 0,
      [UsageType.EQUIPEMENTS]: 0,
      [UsageType.CULTURE]: 0,
      [UsageType.TERTIAIRE]: 0,
      [UsageType.INDUSTRIE]: 0,
      [UsageType.RENATURATION]: 0,
      [UsageType.PHOTOVOLTAIQUE]: 0,
    },
  },

  // 17. Risque naturel
  presenceRisquesNaturels: {
    [RisqueNaturel.FORT]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: -2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [RisqueNaturel.MOYEN]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [RisqueNaturel.FAIBLE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [RisqueNaturel.AUCUN]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
  },

  // 19. Monument historique
  zonagePatrimonial: {
    [ZonagePatrimonial.NON_CONCERNE]: {
      [UsageType.RESIDENTIEL]: 1,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [ZonagePatrimonial.SITE_INSCRIT_CLASSE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
    [ZonagePatrimonial.PERIMETRE_ABF]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
  },

  // 20. Paysage
  qualitePaysage: {
    [QualitePaysage.DEGRADE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [QualitePaysage.BANAL_INFRA_ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [QualitePaysage.QUOTIDIEN_ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [QualitePaysage.INTERESSANT]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [QualitePaysage.REMARQUABLE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
  },

  // 21. Valeur architecturale
  valeurArchitecturaleHistorique: {
    [ValeurArchitecturale.SANS_INTERET]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 2,
    },
    [ValeurArchitecturale.BANAL_INFRA_ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [ValeurArchitecturale.ORDINAIRE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: -1,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [ValeurArchitecturale.INTERET_FORT]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
    [ValeurArchitecturale.EXCEPTIONNEL]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
  },

  // 24. Zonage environnemental
  zonageEnvironnemental: {
    [ZonageEnvironnemental.HORS_ZONE]: {
      [UsageType.RESIDENTIEL]: 1,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [ZonageEnvironnemental.RESERVE_NATURELLE]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: -2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
    [ZonageEnvironnemental.NATURA_2000]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [ZonageEnvironnemental.ZNIEFF_TYPE_1_2]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [ZonageEnvironnemental.PROXIMITE_ZONE]: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
  },

  // 25. Trame verte et bleue
  trameVerteEtBleue: {
    [TrameVerteEtBleue.HORS_TRAME]: {
      [UsageType.RESIDENTIEL]: 1,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 1,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 1,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    [TrameVerteEtBleue.RESERVOIR_BIODIVERSITE]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [TrameVerteEtBleue.CORRIDOR_A_PRESERVER]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [TrameVerteEtBleue.CORRIDOR_A_RESTAURER]: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: -1,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
  },

  // 26. Zonage réglementaire
  zonageReglementaire: {
    [ZonageReglementaire.ZONE_URBAINE_U]: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [ZonageReglementaire.ZONE_A_URBANISER_AU]: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [ZonageReglementaire.ZONE_ACTIVITES]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: -1,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: -2,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    [ZonageReglementaire.ZONE_NATURELLE]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: -1,
    },
    [ZonageReglementaire.ZONE_AGRICOLE]: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 2,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
  },

  // Booléens
  siteEnCentreVille: {
    true: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    },
    false: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 2,
    },
  },

  proximiteCommercesServices: {
    true: {
      [UsageType.RESIDENTIEL]: 2,
      [UsageType.EQUIPEMENTS]: 2,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 1,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
    false: {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
  },

  presenceRisquesTechnologiques: {
    true: {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: -2,
      [UsageType.CULTURE]: -2,
      [UsageType.TERTIAIRE]: -2,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 1,
      [UsageType.PHOTOVOLTAIQUE]: 1,
    },
    false: {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    },
  },

  // Fonctions pour valeurs numériques
  surfaceSite: (value: number): ScoreParUsage => {
    if (value < 10000)
      return {
        [UsageType.RESIDENTIEL]: 1,
        [UsageType.EQUIPEMENTS]: 1,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: -1,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: -2,
      };
    if (value < 15000)
      return {
        [UsageType.RESIDENTIEL]: -1,
        [UsageType.EQUIPEMENTS]: -1,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 1,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: -2,
      };
    if (value < 50000)
      return {
        [UsageType.RESIDENTIEL]: -1,
        [UsageType.EQUIPEMENTS]: -1,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: -1,
        [UsageType.INDUSTRIE]: 1,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 1,
      };
    return {
      [UsageType.RESIDENTIEL]: -1,
      [UsageType.EQUIPEMENTS]: -1,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: -1,
      [UsageType.INDUSTRIE]: 2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 2,
    };
  },

  surfaceBati: (value: number | undefined): ScoreParUsage => {
    if (!value)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 1,
        [UsageType.RENATURATION]: 2,
        [UsageType.PHOTOVOLTAIQUE]: 2,
      };
    return value < 10000
      ? {
          [UsageType.RESIDENTIEL]: 0.5,
          [UsageType.EQUIPEMENTS]: 0.5,
          [UsageType.CULTURE]: 0.5,
          [UsageType.TERTIAIRE]: 0.5,
          [UsageType.INDUSTRIE]: -1,
          [UsageType.RENATURATION]: 0.5,
          [UsageType.PHOTOVOLTAIQUE]: 0.5,
        }
      : {
          [UsageType.RESIDENTIEL]: 0.5,
          [UsageType.EQUIPEMENTS]: 0.5,
          [UsageType.CULTURE]: 0.5,
          [UsageType.TERTIAIRE]: 0.5,
          [UsageType.INDUSTRIE]: 1,
          [UsageType.RENATURATION]: -1,
          [UsageType.PHOTOVOLTAIQUE]: -1,
        };
  },

  tauxLogementsVacants: (value: number): ScoreParUsage => {
    if (value <= 4)
      return {
        [UsageType.RESIDENTIEL]: 2,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 0.5,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 0.5,
      };
    if (value <= 6)
      return {
        [UsageType.RESIDENTIEL]: 1,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 0.5,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 0.5,
      };
    if (value <= 10)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 0.5,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 0.5,
      };
    if (value <= 13)
      return {
        [UsageType.RESIDENTIEL]: -1,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 0.5,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 0.5,
      };
    return {
      [UsageType.RESIDENTIEL]: -2,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 0.5,
    };
  },

  distanceAutoroute: (value: number): ScoreParUsage => {
    if (value < 1)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 2,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: -2,
      };
    if (value < 2)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 1,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: -1,
      };
    if (value < 5)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: -1,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 1,
      };
    return {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: -2,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: 2,
    };
  },

  distanceTransportCommun: (value: number): ScoreParUsage => {
    return value < 500
      ? {
          [UsageType.RESIDENTIEL]: 1,
          [UsageType.EQUIPEMENTS]: 1,
          [UsageType.CULTURE]: 0.5,
          [UsageType.TERTIAIRE]: 1,
          [UsageType.INDUSTRIE]: 1,
          [UsageType.RENATURATION]: 0.5,
          [UsageType.PHOTOVOLTAIQUE]: 0.5,
        }
      : {
          [UsageType.RESIDENTIEL]: 0.5,
          [UsageType.EQUIPEMENTS]: 0.5,
          [UsageType.CULTURE]: 0.5,
          [UsageType.TERTIAIRE]: 0.5,
          [UsageType.INDUSTRIE]: 0.5,
          [UsageType.RENATURATION]: 0.5,
          [UsageType.PHOTOVOLTAIQUE]: 0.5,
        };
  },

  distanceRaccordementElectrique: (value: number): ScoreParUsage => {
    if (value < 1)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 0.5,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: 0.5,
      };
    if (value < 5)
      return {
        [UsageType.RESIDENTIEL]: 0.5,
        [UsageType.EQUIPEMENTS]: 0.5,
        [UsageType.CULTURE]: 0.5,
        [UsageType.TERTIAIRE]: 0.5,
        [UsageType.INDUSTRIE]: 0.5,
        [UsageType.RENATURATION]: 0.5,
        [UsageType.PHOTOVOLTAIQUE]: -1,
      };
    return {
      [UsageType.RESIDENTIEL]: 0.5,
      [UsageType.EQUIPEMENTS]: 0.5,
      [UsageType.CULTURE]: 0.5,
      [UsageType.TERTIAIRE]: 0.5,
      [UsageType.INDUSTRIE]: 0.5,
      [UsageType.RENATURATION]: 0.5,
      [UsageType.PHOTOVOLTAIQUE]: -2,
    };
  },
} as const;

// Export du nombre de critères
export const NOMBRE_CRITERES_MAPPES = 21; // Sur 26 au total

// Configuration des niveaux de fiabilité
export const NIVEAUX_FIABILITE = [
  {
    seuilMin: 9,
    text: 'Très fiable',
    description: 'Analyse complète avec toutes les données disponibles.',
  },
  {
    seuilMin: 7,
    text: 'Fiable',
    description: 'Données analysées avec un niveau de confiance élevé.',
  },
  {
    seuilMin: 5,
    text: 'Moyennement fiable',
    description: 'Analyse partielle, certaines données manquantes.',
  },
  {
    seuilMin: 3,
    text: 'Peu fiable',
    description: 'Données insuffisantes pour une analyse complète.',
  },
  {
    seuilMin: 0,
    text: 'Très peu fiable',
    description: 'Données très incomplètes, résultats indicatifs uniquement.',
  },
] as const;
