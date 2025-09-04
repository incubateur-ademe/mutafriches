import { ApiResponse } from "../shared/api-response.interface";

export interface CadastreServiceResponse {
  identifiant: string;
  commune: string;
  surface: number; // m²
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

export interface ICadastreService {
  getParcelleInfo(identifiant: string): Promise<ApiResponse<CadastreServiceResponse>>;
}
