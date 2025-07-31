import { ApiResponse } from '../shared/api-response.interface';

export interface BdnbBatiment {
  id: string;
  surface: number;
  usage: string;
  etat: string;
}

export interface BdnbApiResponse {
  parcelle: string;
  batiments: BdnbBatiment[];
  surfaceTotaleBatie: number;
}

export interface BdnbApiService {
  getSurfaceBatie(identifiantParcelle: string): Promise<ApiResponse<number>>;
  getBatiments(
    identifiantParcelle: string,
  ): Promise<ApiResponse<BdnbApiResponse>>;
}
