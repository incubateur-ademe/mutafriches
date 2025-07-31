import { ApiResponse } from './api-response.interface';

export interface TransportArret {
  id: string;
  nom: string;
  type: 'bus' | 'tram' | 'metro' | 'train';
  distance: number; // en mètres
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

export interface TransportApiResponse {
  arretLePlusProche: TransportArret;
  distanceMetres: number;
}

export interface TransportApiService {
  getDistanceTransportCommun(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<number>>;
  getArretsProches(
    latitude: number,
    longitude: number,
    rayon?: number,
  ): Promise<ApiResponse<TransportArret[]>>;
}
