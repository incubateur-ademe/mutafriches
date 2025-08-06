import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import {
  BdnbApiService,
  BdnbApiResponse,
} from '../../friches/services/external-apis/bdnb/bdnb.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockBdnbService implements BdnbApiService {
  getSurfaceBatie(identifiantParcelle: string): Promise<ApiResponse<number>> {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    if (!parcelle) {
      return Promise.resolve({
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée`,
        source: 'Mock BDNB',
      });
    }

    return Promise.resolve({
      success: true,
      data: parcelle.surfaceBati || 0,
      source: 'Mock BDNB',
      responseTimeMs: 120,
    });
  }

  getBatiments(
    identifiantParcelle: string,
  ): Promise<ApiResponse<BdnbApiResponse>> {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    if (!parcelle) {
      return Promise.resolve({
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée`,
        source: 'Mock BDNB',
      });
    }

    return Promise.resolve({
      success: true,
      data: {
        parcelle: identifiantParcelle,
        batiments: [
          {
            id: 'bat1',
            surface: parcelle.surfaceBati || 0,
            usage: 'industriel',
            etat: 'bon',
          },
        ],
        surfaceTotaleBatie: parcelle.surfaceBati || 0,
      },
      source: 'Mock BDNB',
      responseTimeMs: 140,
    });
  }

  // Méthode existante (garder pour compatibilité)
  getNombreBatiments(
    identifiantParcelle: string,
  ): Promise<ApiResponse<number>> {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    if (!parcelle) {
      return Promise.resolve({
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée`,
        source: 'Mock BDNB',
      });
    }

    return Promise.resolve({
      success: true,
      data: parcelle.nombreBatiments || 0,
      source: 'Mock BDNB',
      responseTimeMs: 100,
    });
  }
}
