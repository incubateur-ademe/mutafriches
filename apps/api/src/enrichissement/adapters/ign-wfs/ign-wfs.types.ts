/**
 * Réponse brute de l'API WFS IGN (format GeoJSON FeatureCollection)
 */
export interface IgnWfsFeatureCollection {
  type: "FeatureCollection";
  features: IgnWfsTronconRoute[];
  numberMatched?: number;
  numberReturned?: number;
  timeStamp?: string;
}

/**
 * Feature GeoJSON d'un tronçon de route (BD TOPO v3)
 */
export interface IgnWfsTronconRoute {
  type: "Feature";
  id: string;
  geometry: {
    type: "LineString";
    coordinates: number[][]; // [[lon, lat, z], ...] dans le sens de numérisation
  };
  properties: IgnWfsTronconProperties;
}

export interface IgnWfsTronconProperties {
  nature: string; // "Type autoroutier" | "Bretelle" | ...
  // Relatif au sens de numérisation de la géométrie
  sens_de_circulation?: "Sens direct" | "Sens inverse" | "Double sens" | "Sans objet" | string;
}
