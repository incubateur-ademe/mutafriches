import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';
import {
  CadastreApiService,
  CadastreApiResponse,
} from '../../friches/services/external-apis/cadastre/cadastre.interface';
import { MockParcellesHelper } from '../data/parcelles.mock';

@Injectable()
export class MockCadastreService implements CadastreApiService {
  // Méthode requise par l'interface
  getParcelleInfo(
    identifiant: string,
  ): Promise<ApiResponse<CadastreApiResponse>> {
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
        coordonnees: parcelle.coordonnees!,
      },
      source: 'Mock Cadastre',
      responseTimeMs: 150,
    });
  }

  // Méthodes existantes (garder pour compatibilité)
  getDonneesParcelle(identifiantParcelle: string): Promise<
    ApiResponse<{
      identifiant: string;
      commune: string;
      surface: number;
      coordonnees: { latitude: number; longitude: number };
    }>
  > {
    return this.getParcelleInfo(identifiantParcelle);
  }

  verifierExistenceParcelle(
    identifiantParcelle: string,
  ): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findById(identifiantParcelle);

    return Promise.resolve({
      success: true,
      data: parcelle !== null,
      source: 'Mock Cadastre',
      responseTimeMs: 100,
    });
  }
}
