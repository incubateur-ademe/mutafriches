/**
 * Types pour l'adapter WFS ZAER (Zones d'Accélération des Énergies Renouvelables)
 *
 * Deux couches distinctes du même WFS Géoplateforme :
 * - `zaer:zaer` — zones d'accélération arrêtées par les référents préfectoraux
 * - `OFB_INTERDICTION-ZAER-SAUF-TOITURE:...` — zones d'interdiction issues des travaux OFB
 *
 * https://data.geopf.fr/wfs
 */

/**
 * Résultat normalisé d'une requête sur la couche des zones d'accélération
 */
export interface ZaerWfsResult {
  nom: string | null;
  filiere: string;
  detailFiliere: string | null;
}

/**
 * Résultat normalisé d'une requête sur la couche des zones d'interdiction
 */
export interface ZaerExclusionResult {
  /** Code du zonage environnemental support (ex. "FR3600077") */
  code: string | null;
  nomZone: string | null;
  /** Type de zonage support (ex. "Réserve naturelle nationale") */
  typeZone: string | null;
  /** Régime d'interdiction brut : la couche mélange « toutes ENR sauf toiture » et « éolien uniquement » */
  zonage: string | null;
}

/**
 * Feature GeoJSON brute retournée par le WFS
 */
export interface WfsFeature<P> {
  type: "Feature";
  id: string;
  geometry: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  } | null;
  properties: P;
}

/**
 * Réponse brute FeatureCollection du WFS
 */
export interface WfsFeatureCollection<P> {
  type: "FeatureCollection";
  features: WfsFeature<P>[];
  totalFeatures?: number;
  numberMatched?: number;
  numberReturned?: number;
}

/**
 * Propriétés brutes d'une feature de la couche `zaer:zaer`
 */
export interface ZaerWfsProperties {
  nom: string | null;
  filiere: string;
  // Le WFS a scindé detail_filiere en 3 niveaux hiérarchiques (du plus général au plus précis)
  detail_filiere1: string | null;
  detail_filiere2: string | null;
  detail_filiere3: string | null;
  cp: string | null;
  cog: string | null;
  dep: string | null;
  reg: string | null;
  productible: number | null;
  puissance: number | null;
  usage_sol: string | null;
}

/**
 * Propriétés brutes d'une feature de la couche des zones d'interdiction OFB
 */
export interface ZaerExclusionWfsProperties {
  code: string | null;
  nom_zone: string | null;
  type_zone: string | null;
  zonage: string | null;
  jeu_donnee: string | null;
  gest_site: string | null;
  url_fiche: string | null;
}

export type ZaerWfsFeature = WfsFeature<ZaerWfsProperties>;
export type ZaerWfsFeatureCollection = WfsFeatureCollection<ZaerWfsProperties>;
