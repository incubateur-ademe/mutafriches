import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockLovacService {
  getTauxLogementsVacants(commune: string): Promise<ApiResponse<number>> {
    // Trouve une parcelle dans cette commune
    const parcelles = MockParcellesHelper.getAllIds()
      .map((id) => MockParcellesHelper.findById(id))
      .filter(
        (p) => p !== null && p.commune.toLowerCase() === commune.toLowerCase(),
      );

    if (parcelles.length === 0) {
      // Valeur par défaut si commune non trouvée
      return Promise.resolve({
        success: true,
        data: 8.5,
        source: 'Mock Lovac',
      });
    }

    return Promise.resolve({
      success: true,
      data: parcelles[0].tauxLogementsVacants,
      source: 'Mock Lovac',
    });
  }

  getStatistiquesCommune(commune: string): Promise<
    ApiResponse<{
      tauxVacance: number;
      population: number;
      superficie: number;
    }>
  > {
    // Trouve une parcelle dans cette commune
    const parcelles = MockParcellesHelper.getAllIds()
      .map((id) => MockParcellesHelper.findById(id))
      .filter(
        (p) => p !== null && p.commune.toLowerCase() === commune.toLowerCase(),
      );

    if (parcelles.length === 0) {
      return Promise.resolve({
        success: false,
        error: `Commune ${commune} non trouvée`,
        source: 'Mock Lovac',
      });
    }

    const parcelle = parcelles[0];

    return Promise.resolve({
      success: true,
      data: {
        tauxVacance: parcelle.tauxLogementsVacants,
        population: 15000, // Valeur fictive
        superficie: 25.5, // Valeur fictive en km²
      },
      source: 'Mock Lovac',
    });
  }
}
