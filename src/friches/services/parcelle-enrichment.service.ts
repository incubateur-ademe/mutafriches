import { Injectable } from '@nestjs/common';
import { Parcelle } from '../entities/parcelle.entity';
import { MockService } from '../../friches-mock/mock-api.service';
import { ApiResponse } from './external-apis/shared/api-response.interface';
import { CadastreApiResponse } from './external-apis/cadastre/cadastre.interface';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';

@Injectable()
export class ParcelleEnrichmentService {
  constructor(private readonly mockService: MockService) {}

  /**
   * Enrichit une parcelle depuis toutes les sources externes disponibles
   */
  async enrichFromDataSources(
    identifiantParcelle: string,
  ): Promise<EnrichmentResultDto> {
    console.log(`Enrichissement parcelle: ${identifiantParcelle}`);

    const sourcesUtilisees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Données cadastrales (obligatoires)
    const cadastreData = await this.getCadastreData(identifiantParcelle);
    if (!cadastreData) {
      throw new Error('Données cadastrales introuvables');
    }

    const parcelle = new Parcelle(
      cadastreData.identifiant,
      cadastreData.commune,
    );
    parcelle.surfaceSite = cadastreData.surface;
    parcelle.coordonnees = cadastreData.coordonnees;
    sourcesUtilisees.push('Cadastre');

    // 2. Surface bâtie
    const surfaceBatie = await this.getSurfaceBatie(identifiantParcelle);
    if (surfaceBatie !== null) {
      parcelle.surfaceBati = surfaceBatie;
      sourcesUtilisees.push('BDNB');
    } else {
      champsManquants.push('surfaceBati');
    }

    // 3. Distance transport
    if (parcelle.coordonnees) {
      const distanceTransport = await this.getDistanceTransport(
        parcelle.coordonnees,
      );
      if (distanceTransport !== null) {
        parcelle.distanceTransportCommun = distanceTransport;
        sourcesUtilisees.push('Transport');
      } else {
        champsManquants.push('distanceTransportCommun');
      }
    }

    // 4. Autres champs via Mock
    await this.enrichWithMockData(
      parcelle,
      identifiantParcelle,
      sourcesUtilisees,
      champsManquants,
    );

    const fiabilite = this.calculateFiabilite(
      sourcesUtilisees.length,
      champsManquants.length,
    );

    console.log(
      `Enrichissement terminé - Sources: ${sourcesUtilisees.length}, Manquants: ${champsManquants.length}`,
    );

    return {
      parcelle,
      sourcesUtilisees,
      champsManquants,
      fiabilite,
    };
  }

  private async getCadastreData(
    identifiant: string,
  ): Promise<CadastreApiResponse | null> {
    const result = (await this.mockService.getMockCadastreData(
      identifiant,
    )) as ApiResponse<CadastreApiResponse>;
    return result.success && result.data ? result.data : null;
  }

  private async getSurfaceBatie(identifiant: string): Promise<number | null> {
    const result = await this.mockService.getMockBdnbData(identifiant);
    return result.success && result.data !== undefined ? result.data : null;
  }

  private async getDistanceTransport(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<number | null> {
    const result = await this.mockService.getMockTransportData(
      coordonnees.latitude,
      coordonnees.longitude,
    );
    return result.success && result.data !== undefined ? result.data : null;
  }

  private async enrichWithMockData(
    parcelle: Parcelle,
    identifiant: string,
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    const champs = [
      'ancienneActivite',
      'connectionReseauElectricite',
      'distanceRaccordementElectrique',
      'siteEnCentreVille',
      'distanceAutoroute',
      'proximiteCommercesServices',
      'tauxLogementsVacants',
      'presenceRisquesTechnologiques',
      'presenceRisquesNaturels',
      'zonageEnvironnemental',
      'zonageReglementaire',
      'zonagePatrimonial',
      'trameVerteEtBleue',
    ];

    for (const champ of champs) {
      const result = (await this.mockService.getMockData(
        champ,
        identifiant,
      )) as ApiResponse<unknown>;

      if (result.success) {
        // Cast correct pour éviter l'erreur TypeScript
        (parcelle as unknown as Record<string, unknown>)[champ] = result.data;
      } else {
        manquants.push(champ);
      }
    }

    sources.push('Mock APIs');
  }

  private calculateFiabilite(
    sourcesCount: number,
    manquantsCount: number,
  ): number {
    let fiabilite = 10;
    fiabilite -= manquantsCount * 0.3;
    fiabilite -= sourcesCount > 2 ? 0 : 2; // Bonus si plusieurs sources
    return Math.max(0, Math.min(10, Math.round(fiabilite * 10) / 10));
  }
}
