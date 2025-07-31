import { ApiResponse } from './api-response.interface';

export interface MockApiService {
  getMockData(
    champ: string,
    identifiantParcelle: string,
  ): Promise<ApiResponse<any>>;
  getMockParcelle(identifiantParcelle: string): Promise<ApiResponse<any>>;
}
