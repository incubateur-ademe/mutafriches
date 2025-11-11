import { ApiResponse } from "../shared/api-response.types";

/**
 * Réponse normalisée du service IGN WFS
 */
export interface IgnWfsServiceResponse {
  distanceMetres: number;
  nombreTronconsProches: number;
}

/**
 * Interface du service
 */
export interface IIgnWfsService {
  getDistanceVoieGrandeCirculation(
    latitude: number,
    longitude: number,
    rayonMetres?: number,
  ): Promise<ApiResponse<IgnWfsServiceResponse>>;
}

/**
 * Réponse brute de l'API WFS IGN (format GeoJSON FeatureCollection)
 */
export interface IgnWfsFeatureCollection {
  type: "FeatureCollection";
  features: IgnWfsTronconRoute[];
  numberMatched?: number;
  numberReturned?: number;
  timeStamp?: string;
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
}

/**
 * Feature GeoJSON d'un tronçon de route
 */
export interface IgnWfsTronconRoute {
  type: "Feature";
  id: string;
  geometry: {
    type: "LineString";
    coordinates: number[][]; // [[lon1, lat1], [lon2, lat2], ...]
  };
  properties: IgnWfsTronconProperties;
  geometry_name?: string;
}

/**
 * Propriétés métier d'un tronçon de route (BD TOPO v3)
 */
export interface IgnWfsTronconProperties {
  id: string;

  // Classification de la route
  NATURE: string; // "Type autoroutier" | "Route à 2 chaussées" | "Bretelle" | "Route empierrée" | ...
  IMPORTANCE: number; // 1 = très structurant, 2 = structurant, 3-5 = moins important

  // Caractéristiques
  CL_ADMIN?: string; // Classe administrative (ex: "Autoroute", "Nationale")
  NUMERO?: string; // Numéro de route (ex: "A6", "N7")
  NOM_RUE_G?: string; // Nom de rue côté gauche
  NOM_RUE_D?: string; // Nom de rue côté droit

  // Informations techniques
  FICTIF?: boolean; // Tronçon fictif ou non
  FRANCHISSEMENT?: string; // Type de franchissement (pont, tunnel)
  LARGEUR_CHAUSSEE?: string; // Largeur en mètres
  NB_VOIES?: number; // Nombre de voies

  // Sens de circulation
  SENS?: string; // "Sens direct" | "Sens inverse" | "Double sens"

  // Position administrative
  ETAT?: string; // État du tronçon

  // Dates
  DATE_CREATION?: string;
  DATE_MODIFICATION?: string;
  DATE_CONFIRMATION?: string;
}
