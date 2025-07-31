import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockBdnbService {
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
    });
  }

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
    });
  }
}
