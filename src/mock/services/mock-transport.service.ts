import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockTransportService {
  getDistanceTransportCommun(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<number>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    if (!parcelle) {
      // Valeur par défaut si aucune parcelle trouvée
      return Promise.resolve({
        success: true,
        data: 800,
        source: 'Mock Transport',
      });
    }

    return Promise.resolve({
      success: true,
      data: parcelle.distanceTransportCommun,
      source: 'Mock Transport',
    });
  }

  getProximiteServices(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: parcelle?.proximiteCommercesServices ?? false,
      source: 'Mock Transport',
    });
  }
}
