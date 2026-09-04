/**
 * Types pour l'adapter WFS ZAER (Zones d'Accélération des Énergies Renouvelables)
 *
 * Source : Géoplateforme WFS — typename zaer:zaer
 * https://data.geopf.fr/wfs?service=WFS&request=GetFeature&typename=zaer:zaer
 */

/**
 * Résultat normalisé d'une requête ZAER
 */
export interface ZaerWfsResult {
  nom: string | null;
  filiere: string;
  detailFiliere: string | null;
  /** Type de zonage APER brut (ex. "Interdiction ZAER (loi APER) toutes ENR sauf toiture") */
  zonage: string | null;
}

/**
 * Feature GeoJSON brute retournée par le WFS ZAER
 */
export interface ZaerWfsFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  } | null;
  properties: ZaerWfsProperties;
}

/**
 * Propriétés brutes d'une feature ZAER
 */
export interface ZaerWfsProperties {
  nom: string | null;
  filiere: string;
  // Distingue une zone d'accélération d'une zone d'interdiction au sens de la loi APER
  zonage: string | null;
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
 * Réponse brute FeatureCollection du WFS
 */
export interface ZaerWfsFeatureCollection {
  type: "FeatureCollection";
  features: ZaerWfsFeature[];
  totalFeatures?: number;
  numberMatched?: number;
  numberReturned?: number;
}
