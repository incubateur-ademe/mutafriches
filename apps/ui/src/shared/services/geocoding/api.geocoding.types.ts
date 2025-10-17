/**
 * Suggestion d'adresse pour l'auto-complétion
 */
export interface AddressSuggestion {
  label: string;
  coordinates: [number, number]; // [lng, lat]
  city: string;
  postcode: string;
}

/**
 * Feature retournée par l'API Géocodage Géoplateforme
 */
export interface GeocodingApiFeature {
  type: "Feature";
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    label: string;
    city?: string;
    postcode?: string;
    score: number;
  };
}

/**
 * Réponse complète de l'API Géocodage
 */
export interface GeocodingApiResponse {
  type: "FeatureCollection";
  features: GeocodingApiFeature[];
}
