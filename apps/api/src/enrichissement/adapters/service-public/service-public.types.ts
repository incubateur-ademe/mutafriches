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
 * Réponse brute de l'API Annuaire Service Public (OpenDataSoft v2.1)
 * https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/console
 */
export interface ServicePublicApiResponse {
  total_count: number;
  results: ServicePublicRecord[];
}

export interface ServicePublicRecord {
  id: string;
  nom: string;
  code_insee_commune: string | null;
  pivot: string | null;
  adresse: string | null;
  type_organisme: string | null;
  telephone?: string | null;
  adresse_courriel?: string | null;
  site_internet?: string | null;
  plage_ouverture?: string | null;
}

/**
 * Structure parsée du champ adresse
 */
export interface ServicePublicAdresseItem {
  type_adresse: "Adresse" | "Adresse postale";
  complement1: string;
  complement2: string;
  numero_voie: string;
  service_distribution: string;
  code_postal: string;
  nom_commune: string;
  pays: string;
  continent: string;
  longitude: string;
  latitude: string;
}

/**
 * Structure parsée du champ pivot
 */
export interface ServicePublicPivotItem {
  type_service_local: string;
  code_insee_commune: string[];
}
