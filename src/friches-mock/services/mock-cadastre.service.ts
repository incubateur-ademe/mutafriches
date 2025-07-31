import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockCadastreService {
  getDonneesParcelle(identifiantParcelle: string): Promise<
    ApiResponse<{
      identifiant: string;
      commune: string;
      surface: number;
      coordonnees: { latitude: number; longitude: number };
    }>
  > {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    if (!parcelle) {
      return Promise.resolve({
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée`,
        source: 'Mock Cadastre',
      });
    }

    return Promise.resolve({
      success: true,
      data: {
        identifiant: parcelle.identifiantParcelle,
        commune: parcelle.commune,
        surface: parcelle.surfaceSite,
        coordonnees: parcelle.coordonnees!,
      },
      source: 'Mock Cadastre',
    });
  }

  verifierExistenceParcelle(
    identifiantParcelle: string,
  ): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    return Promise.resolve({
      success: true,
      data: parcelle !== null,
      source: 'Mock Cadastre',
    });
  }
}
