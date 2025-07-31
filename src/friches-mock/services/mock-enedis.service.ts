import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockEnedisService {
  getConnectionElectricite(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: parcelle?.connectionReseauElectricite ?? true,
      source: 'Mock Enedis',
    });
  }

  getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<number>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: parcelle?.distanceRaccordementElectrique ?? 0.5,
      source: 'Mock Enedis',
    });
  }
}
