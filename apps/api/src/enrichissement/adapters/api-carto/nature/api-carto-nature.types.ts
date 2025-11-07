import { ApiResponse } from "../../shared/api-response.types";

/**
 * Réponse brute de l'API Carto Nature (format GeoJSON)
 */
export interface ApiCartoNatureResponse {
  type: string;
  features: ApiCartoNatureFeature[];
  totalFeatures: number;
  numberMatched?: number;
  numberReturned?: number;
  timeStamp?: string;
}

/**
 * Feature GeoJSON de l'API Carto Nature
 */
export interface ApiCartoNatureFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

/**
 * Résultat enrichi des zones environnementales détectées
 */
export interface ZoneEnvironnementaleDetectee {
  type: "natura2000" | "znieff1" | "znieff2" | "pnr" | "pnn" | "reserve-naturelle";
  nom?: string;
  code?: string;
  url?: string;
}

/**
 * Interface du service API Carto Nature
 */
export interface IApiCartoNatureService {
  queryNatura2000Habitats(geometry: any): Promise<ApiResponse<ApiCartoNatureResponse>>;
  queryNatura2000Oiseaux(geometry: any): Promise<ApiResponse<ApiCartoNatureResponse>>;
  queryZnieff1(geometry: any): Promise<ApiResponse<ApiCartoNatureResponse>>;
  queryZnieff2(geometry: any): Promise<ApiResponse<ApiCartoNatureResponse>>;
  queryParcNaturelRegional(geometry: any): Promise<ApiResponse<ApiCartoNatureResponse>>;
  queryReservesNaturelles(geometry: any): Promise<ApiResponse<ApiCartoNatureResponse>>;
}
