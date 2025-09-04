import { ApiResponse } from '../shared/api-response.interface';

export interface OverpassAutoroute {
  nom: string;
  type: 'autoroute' | 'voie_rapide';
  distance: number; // km
  entree: {
    nom: string;
    coordonnees: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface OverpassCommerce {
  type: 'supermarche' | 'pharmacie' | 'ecole' | 'hopital' | 'poste';
  nom: string;
  distance: number; // mètres
}

export interface OverpassApiService {
  getDistanceAutoroute(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<OverpassAutoroute>>;
  checkCommercesProximite(
    latitude: number,
    longitude: number,
    rayon?: number,
  ): Promise<ApiResponse<OverpassCommerce[]>>;
  checkCentreVille(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<boolean>>;
}
