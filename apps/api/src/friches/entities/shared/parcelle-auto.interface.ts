import {
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  ZonageReglementaire,
} from "@mutafriches/shared-types";

/**
 * Interface pour les données extraites automatiquement depuis des sources externes
 * Ces données sont obtenues via l'enrichissement automatique (DVF, Cadastre, SIRENE, etc.)
 */
export interface ParcelleAutoData {
  /**
   * Identifiant unique de la parcelle (format cadastral)
   * Source: Cadastre
   * Utilisé comme identifiant principal
   */
  identifiantParcelle: string;

  /**
   * Nom de la commune où se situe la parcelle
   * Source: Cadastre
   * Utilisé pour le contexte géographique
   */
  commune: string;

  /**
   * Surface totale du site en mètres carrés
   * Source: Cadastre
   */
  surfaceSite: number;

  /**
   * Surface au sol occupée par les bâtiments en mètres carrés
   * Source: Cadastre
   */
  surfaceBati?: number;

  /**
   * Indique si le site est connecté au réseau électrique
   * Source: Données infrastructures
   */
  connectionReseauElectricite: boolean;

  /**
   * Description de l'ancienne activité du site
   * Source: SIRENE, Base ICPE
   */
  ancienneActivite?: string;

  /**
   * Indique si le site se trouve en centre-ville ou centre-bourg
   * Source: Calcul géographique
   */
  siteEnCentreVille: boolean;

  /**
   * Distance à l'entrée d'autoroute la plus proche en kilomètres
   * Source: Calcul géographique
   */
  distanceAutoroute: number;

  /**
   * Distance à l'arrêt de transport en commun le plus proche en mètres
   * Source: Données transport public
   */
  distanceTransportCommun: number;

  /**
   * Indique la présence de commerces et services à proximité
   * Source: Calcul géographique
   */
  proximiteCommercesServices: boolean;

  /**
   * Distance au point de raccordement électrique le plus proche en kilomètres
   * Source: Données infrastructures
   */
  distanceRaccordementElectrique: number;

  /**
   * Taux de logements vacants dans la commune en pourcentage
   * Source: INSEE
   */
  tauxLogementsVacants: number;

  /**
   * Indique la présence de risques technologiques
   * Source: Base ICPE
   */
  presenceRisquesTechnologiques: boolean;

  /**
   * Niveau de risques naturels (inondations, argiles, etc.)
   * Source: Géorisques
   */
  presenceRisquesNaturels?: RisqueNaturel | string;

  /**
   * Type de zonage environnemental applicable
   * Source: INPN
   */
  zonageEnvironnemental?: ZonageEnvironnemental | string;

  /**
   * Zonage réglementaire selon le PLU/PLUi
   * Source: GPU
   */
  zonageReglementaire?: ZonageReglementaire | string;

  /**
   * Type de protection patrimoniale
   * Source: Mérimée, Atlas des patrimoines
   */
  zonagePatrimonial?: ZonagePatrimonial | string;

  /**
   * Position par rapport à la trame verte et bleue
   * Source: INPN, données TVB régionales
   */
  trameVerteEtBleue?: TrameVerteEtBleue | string;

  /**
   * Coordonnées géographiques de la parcelle
   * Source: Cadastre
   * Non utilisé pour le calcul de mutabilité mais utile pour affichage cartographique
   */
  coordonnees?: {
    latitude: number;
    longitude: number;
  };
}
