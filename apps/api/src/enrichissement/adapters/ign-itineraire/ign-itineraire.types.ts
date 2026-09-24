export interface PointWgs84 {
  longitude: number;
  latitude: number;
}

// Réponse brute du service d'itinéraire Géoplateforme (champs utilisés uniquement)
export interface IgnItineraireReponse {
  distance: number;
  duration?: number;
}

export interface IgnItineraireResultat {
  distanceMetres: number;
}
