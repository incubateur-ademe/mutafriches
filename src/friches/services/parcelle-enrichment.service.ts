import { Injectable } from '@nestjs/common';
import { Parcelle } from '../entities/parcelle.entity';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';
import { MockCadastreService } from '../../mock/services/mock-cadastre.service';
import { MockBdnbService } from '../../mock/services/mock-bdnb.service';
import { MockEnedisService } from '../../mock/services/mock-enedis.service';
import { MockTransportService } from '../../mock/services/mock-transport.service';
import { MockOverpassService } from '../../mock/services/mock-overpass.service';
import { MockLovacService } from '../../mock/services/mock-lovac.service';
import { ApiResponse } from './external-apis/shared/api-response.interface';
import { CadastreApiResponse } from './external-apis/cadastre/cadastre.interface';
import { EnedisRaccordement } from './external-apis/enedis/enedis.interface';
import { IParcelleEnrichmentService } from '../interfaces/parcelle-enrichment-service.interface';

@Injectable()
export class ParcelleEnrichmentService implements IParcelleEnrichmentService {
  constructor(
    private readonly cadastreService: MockCadastreService,
    private readonly bdnbService: MockBdnbService,
    private readonly transportService: MockTransportService,
    private readonly enedisService: MockEnedisService,
    private readonly overpassService: MockOverpassService,
    private readonly lovacService: MockLovacService,
  ) {}

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

    // 2. Surface bâtie (BDNB)
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

      // 4. Données Enedis
      await this.enrichWithEnedisData(
        parcelle,
        parcelle.coordonnees,
        sourcesUtilisees,
        champsManquants,
      );

      // 5. Données Overpass
      await this.enrichWithOverpassData(
        parcelle,
        parcelle.coordonnees,
        sourcesUtilisees,
        champsManquants,
      );
    }

    // 6. Données Lovac
    await this.enrichWithLovacData(
      parcelle,
      cadastreData.commune,
      sourcesUtilisees,
      champsManquants,
    );

    // 7. Données complémentaires (en attendant les vrais services)
    // TODO: Remplacer par de vrais services
    await this.enrichWithRemainingMockData(
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
      // Données déduites automatiquement de la parcelle
      identifiantParcelle: parcelle.identifiantParcelle,
      commune: parcelle.commune,
      surfaceSite: parcelle.surfaceSite,
      surfaceBati: parcelle.surfaceBati,
      connectionReseauElectricite: parcelle.connectionReseauElectricite,
      distanceRaccordementElectrique: parcelle.distanceRaccordementElectrique,
      siteEnCentreVille: parcelle.siteEnCentreVille,
      distanceAutoroute: parcelle.distanceAutoroute,
      distanceTransportCommun: parcelle.distanceTransportCommun,
      proximiteCommercesServices: parcelle.proximiteCommercesServices,
      tauxLogementsVacants: parcelle.tauxLogementsVacants,
      ancienneActivite: parcelle.ancienneActivite,
      presenceRisquesTechnologiques: parcelle.presenceRisquesTechnologiques,
      presenceRisquesNaturels: parcelle.presenceRisquesNaturels,
      zonageEnvironnemental: parcelle.zonageEnvironnemental,
      zonageReglementaire: parcelle.zonageReglementaire,
      zonagePatrimonial: parcelle.zonagePatrimonial,
      trameVerteEtBleue: parcelle.trameVerteEtBleue,
      coordonnees: parcelle.coordonnees,

      // Métadonnées d'enrichissement
      sourcesUtilisees,
      champsManquants,
      fiabilite,
    } as EnrichmentResultDto;
  }

  /**
   * Récupère les données cadastrales
   */
  private async getCadastreData(
    identifiant: string,
  ): Promise<CadastreApiResponse | null> {
    try {
      const result = await this.cadastreService.getParcelleInfo(identifiant);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('Erreur cadastre:', error);
      return null;
    }
  }

  /**
   * Récupère la surface bâtie depuis BDNB
   */
  private async getSurfaceBatie(identifiant: string): Promise<number | null> {
    try {
      const result = await this.bdnbService.getSurfaceBatie(identifiant);
      return result.success && result.data !== undefined ? result.data : null;
    } catch (error) {
      console.error('Erreur BDNB:', error);
      return null;
    }
  }

  /**
   * Récupère la distance au transport en commun
   */
  private async getDistanceTransport(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<number | null> {
    try {
      const result = await this.transportService.getDistanceTransportCommun(
        coordonnees.latitude,
        coordonnees.longitude,
      );
      return result.success && result.data !== undefined ? result.data : null;
    } catch (error) {
      console.error('Erreur Transport:', error);
      return null;
    }
  }

  /**
   * Enrichit avec les données Enedis
   */
  private async enrichWithEnedisData(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number },
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    try {
      // Connection électrique
      const connectionResult: ApiResponse<boolean> =
        await this.enedisService.checkConnection(parcelle.identifiantParcelle);

      if (connectionResult.success && connectionResult.data !== undefined) {
        parcelle.connectionReseauElectricite = connectionResult.data;
      } else {
        manquants.push('connectionReseauElectricite');
      }

      // Distance raccordement
      const distanceResult: ApiResponse<EnedisRaccordement> =
        await this.enedisService.getDistanceRaccordement(
          coordonnees.latitude,
          coordonnees.longitude,
        );

      if (distanceResult.success && distanceResult.data) {
        parcelle.distanceRaccordementElectrique = distanceResult.data.distance;
        sources.push('Enedis');
      } else {
        manquants.push('distanceRaccordementElectrique');
      }
    } catch (error) {
      console.error('Erreur Enedis:', error);
      manquants.push(
        'connectionReseauElectricite',
        'distanceRaccordementElectrique',
      );
    }
  }

  /**
   * Enrichit avec les données Overpass
   */
  private async enrichWithOverpassData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parcelle: Parcelle,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    coordonnees: { latitude: number; longitude: number },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sources: string[],

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    manquants: string[],
  ): Promise<void> {
    // TODO: Implémenter les appels aux services Overpass pour récupérer les données
  }

  /**
   * Enrichit avec les données Lovac
   */
  private async enrichWithLovacData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parcelle: Parcelle,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    commune: string,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sources: string[],

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    manquants: string[],
  ): Promise<void> {
    // TODO: Implémenter l'appel au service Lovac pour récupérer les données
  }

  /**
   * Enrichit avec les données mockées restantes
   * TODO: Remplacer par de vrais services quand disponibles
   */
  private async enrichWithRemainingMockData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parcelle: Parcelle,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    identifiant: string,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sources: string[],

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    manquants: string[],
  ): Promise<void> {
    // TODO: Ces champs seront enrichis par de vrais services plus tard
  }

  /**
   * Calcule l'indice de fiabilité
   */
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
