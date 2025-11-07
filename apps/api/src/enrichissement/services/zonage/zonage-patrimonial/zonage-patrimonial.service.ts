import { Injectable, Logger } from '@nestjs/common';
import {  SourceEnrichissement } from '@mutafriches/shared-types';
import { ApiCartoGpuService } from '../../../adapters/api-carto/gpu/api-carto-gpu.service';
import { ParcelleGeometry } from '../../shared/geometry.types';
import { EnrichmentResult } from '../../shared/enrichissement.types';
import { ZonagePatrimonialCalculator } from './zonage-patrimonial.calculator';
import {
  EvaluationZonagePatrimonial,
  ResultatAC1,
  ResultatAC2,
  ResultatAC4,
} from './zonage-patrimonial.types';

/**
 * Service d'enrichissement du sous-domaine Zonage Patrimonial
 *
 * Responsabilités :
 * - Appeler les APIs API Carto GPU (SUP AC1/AC2/AC4) en parallèle
 * - Transformer les réponses API en résultats structurés
 * - Utiliser le calculator pour évaluer le zonage final
 */
@Injectable()
export class ZonagePatrimonialService {
  private readonly logger = new Logger(ZonagePatrimonialService.name);

  constructor(
    private readonly apiCartoGpuService: ApiCartoGpuService,
    private readonly calculator: ZonagePatrimonialCalculator,
  ) {}

  /**
   * Enrichit avec le zonage patrimonial
   *
   * @param geometry - Géométrie de la parcelle
   * @returns Résultat de l'enrichissement et évaluation détaillée
   */
  async enrichir(geometry: ParcelleGeometry): Promise<{
    result: EnrichmentResult;
    evaluation: EvaluationZonagePatrimonial;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    // Appeler les 3 SUP en parallèle
    const [ac1Result, ac2Result, ac4Result] = await Promise.allSettled([
      this.getAC1(geometry),
      this.getAC2(geometry),
      this.getAC4(geometry),
    ]);

    // Traiter les résultats
    let ac1Data: ResultatAC1 | null = null;
    let ac2Data: ResultatAC2 | null = null;
    let ac4Data: ResultatAC4 | null = null;

    // 1. Traiter AC1
    if (ac1Result.status === 'fulfilled' && ac1Result.value) {
      ac1Data = ac1Result.value;
      sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      this.logger.debug(
        `AC1: ${ac1Data.present ? `${ac1Data.nombreZones} zone(s) - ${ac1Data.type}` : 'aucune'}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.API_CARTO_GPU);
    }

    // 2. Traiter AC2
    if (ac2Result.status === 'fulfilled' && ac2Result.value) {
      ac2Data = ac2Result.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_GPU)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      }
      this.logger.debug(
        `AC2: ${ac2Data.present ? `${ac2Data.nombreZones} zone(s)` : 'aucune'}`,
      );
    }

    // 3. Traiter AC4
    if (ac4Result.status === 'fulfilled' && ac4Result.value) {
      ac4Data = ac4Result.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_GPU)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      }
      this.logger.debug(
        `AC4: ${ac4Data.present ? `${ac4Data.nombreZones} zone(s) - ${ac4Data.type}` : 'aucune'}`,
      );
    }

    // 4. Évaluer le zonage final avec le calculator
    const zonageFinal = this.calculator.evaluer(ac1Data, ac2Data, ac4Data);

    this.logger.log(`Zonage patrimonial final: ${zonageFinal}`);

    return {
      result: {
        success: sourcesUtilisees.length > 0,
        sourcesUtilisees,
        sourcesEchouees,
      },
      evaluation: {
        ac1: ac1Data,
        ac2: ac2Data,
        ac4: ac4Data,
        zonageFinal,
      },
    };
  }

  private async getAC1(geometry: ParcelleGeometry): Promise<ResultatAC1 | null> {
    try {
      const result = await this.apiCartoGpuService.getSupAC1(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          present: false,
          nombreZones: 0,
        };
      }

      const type = this.calculator.mapAC1Features(result.data.features);

      return {
        present: true,
        nombreZones: result.data.totalFeatures,
        type: type || undefined,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la recuperation AC1:', error);
      return null;
    }
  }

  private async getAC2(geometry: ParcelleGeometry): Promise<ResultatAC2 | null> {
    try {
      const result = await this.apiCartoGpuService.getSupAC2(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          present: false,
          nombreZones: 0,
        };
      }

      return {
        present: true,
        nombreZones: result.data.totalFeatures,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la recuperation AC2:', error);
      return null;
    }
  }

  private async getAC4(geometry: ParcelleGeometry): Promise<ResultatAC4 | null> {
    try {
      const result = await this.apiCartoGpuService.getSupAC4(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          present: false,
          nombreZones: 0,
        };
      }

      const type = this.calculator.mapAC4Features(result.data.features);

      return {
        present: true,
        nombreZones: result.data.totalFeatures,
        type: type || undefined,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la recuperation AC4:', error);
      return null;
    }
  }
}
