import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import {
  EnedisApiService,
  EnedisRaccordement,
} from '../../friches/services/external-apis/enedis/enedis.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockEnedisService implements EnedisApiService {
  checkConnection(identifiantParcelle: string): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    return Promise.resolve({
      success: true,
      data: parcelle?.connectionReseauElectricite ?? true,
      source: 'Mock Enedis',
      responseTimeMs: 150,
    });
  }

  getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisRaccordement>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: {
        distance: parcelle?.distanceRaccordementElectrique ?? 0.5,
        type: 'BT',
        capaciteDisponible: true,
      },
      source: 'Mock Enedis',
      responseTimeMs: 180,
    });
  }

  // Méthodes existantes (garder pour compatibilité avec l'ancien code)
  getConnectionElectricite(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: parcelle?.connectionReseauElectricite ?? true,
      source: 'Mock Enedis',
      responseTimeMs: 150,
    });
  }

  getDistanceRaccordementLegacy(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<number>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: parcelle?.distanceRaccordementElectrique ?? 0.5,
      source: 'Mock Enedis',
      responseTimeMs: 180,
    });
  }
}
