import { ApiResponse } from '../shared/api-response.interface';

export interface CadastreApiResponse {
  identifiant: string;
  commune: string;
  surface: number; // m²
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

export interface CadastreApiService {
  getParcelleInfo(
    identifiant: string,
  ): Promise<ApiResponse<CadastreApiResponse>>;
}
