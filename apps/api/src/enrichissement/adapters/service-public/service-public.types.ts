import { Coordonnees } from "@mutafriches/shared-types";
import { ApiResponse } from "../shared/api-response.types";

/**
 * Réponse normalisée du service
 */
export interface ServicePublicServiceResponse {
  codeInsee: string;
  nomCommune: string;
  coordonnees: Coordonnees;
  adresse: string;
}

/**
 * Interface du service
 */
export interface IServicePublicService {
  getMairieCoordonnees(codeInsee: string): Promise<ApiResponse<ServicePublicServiceResponse>>;
}

/**
 * Réponse brute de l'API Annuaire Service Public (format GeoJSON)
 */
export interface ServicePublicMairieResponse {
  type: "FeatureCollection";
  features: ServicePublicFeature[];
}

export interface ServicePublicFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    nom: string;
    pivot: string; // Code INSEE
    adresses: ServicePublicAdresse[];
    horaires?: any;
    email?: string;
    telephone?: string;
    url?: string;
    zonage?: {
      communes: string[];
    };
  };
}

export interface ServicePublicAdresse {
  type: "géopostale" | "postale" | "physique";
  lignes: string[];
  code_postal: string;
  commune?: string;
}
