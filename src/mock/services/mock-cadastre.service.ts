import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import {
  ICadastreService,
  CadastreServiceResponse,
} from '../../friches/services/external-apis/cadastre/cadastre.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockCadastreService implements ICadastreService {
  // Méthode requise par l'interface
  getParcelleInfo(
    identifiant: string,
  ): Promise<ApiResponse<CadastreServiceResponse>> {
    const parcelle = MockParcellesHelper.findById(identifiant);

    if (!parcelle) {
      return Promise.resolve({
        success: false,
        error: `Parcelle ${identifiant} non trouvée`,
        source: 'Mock Cadastre',
      });
    }

    return Promise.resolve({
      success: true,
      data: {
        identifiant: parcelle.identifiantParcelle,
        commune: parcelle.commune,
        surface: parcelle.surfaceSite,
        coordonnees: parcelle.coordonnees,
      },
      source: 'Mock Cadastre',
      responseTimeMs: 150,
    });
  }
}
