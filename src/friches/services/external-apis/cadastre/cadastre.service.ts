import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // ← Import manquant !
import { ApiResponse } from '../shared/api-response.interface';
import {
  CadastreServiceResponse,
  CadastreApiService,
} from './cadastre.interface';
import {
  IGNLocalisantFeature,
  IGNLocalisantResponse,
  IGNParcelleFeature,
  IGNParcelleResponse,
} from './ign-api.interfaces';

@Injectable()
export class CadastreService implements CadastreApiService {
  private readonly baseUrl =
    process.env.IGN_CADASTRE_API_URL || 'https://apicarto.ign.fr/api/cadastre';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère les informations d'une parcelle par son identifiant
   */
  async getParcelleInfo(
    identifiant: string,
  ): Promise<ApiResponse<CadastreServiceResponse>> {
    const startTime = Date.now();

    try {
      console.log(`Récupération données parcelle: ${identifiant}`);

      // Valider le format de l'identifiant parcellaire
      if (!this.isValidParcelId(identifiant)) {
        return {
          success: false,
          error: `Format d'identifiant parcellaire invalide: ${identifiant}`,
          source: 'IGN Cadastre',
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Extraire les composants de l'identifiant
      const parcelComponents = this.parseParcelId(identifiant);
      if (!parcelComponents) {
        return {
          success: false,
          error: `Impossible de parser l'identifiant: ${identifiant}`,
          source: 'IGN Cadastre',
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Appels parallèles optimisés
      const [parcelleResult, localisantResult] = await Promise.all([
        this.fetchParcelle(parcelComponents),
        this.fetchLocalisant(parcelComponents),
      ]);

      // Vérifier que la parcelle existe
      if (!parcelleResult.success || !parcelleResult.data) {
        return {
          success: false,
          error: parcelleResult.error || 'Parcelle non trouvée',
          source: 'IGN Cadastre',
          responseTimeMs: Date.now() - startTime,
        };
      }

      const parcelle = parcelleResult.data;

      // Validation de l'IDU (sécurité)
      if (parcelle.properties.idu !== identifiant) {
        console.warn(
          `IDU mismatch: demandé ${identifiant}, reçu ${parcelle.properties.idu}`,
        );
      }

      // Coordonnées depuis localisant ou fallback
      const coordonnees = this.extractCoordonnees(localisantResult, parcelle);

      const responseTimeMs = Date.now() - startTime;

      return {
        success: true,
        data: {
          identifiant,
          commune: parcelle.properties.nom_com,
          surface: Math.round(parcelle.properties.contenance),
          coordonnees,
        },
        source: 'IGN Cadastre',
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      console.error(
        `Erreur lors de la récupération de la parcelle ${identifiant}:`,
        error,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        source: 'IGN Cadastre',
        responseTimeMs,
      };
    }
  }

  /**
   * Valide le format d'un identifiant parcellaire
   */
  private isValidParcelId(identifiant: string): boolean {
    // Format attendu: 8 chiffres, 2 lettres/numéros, 4 chiffres
    // TODO : Vérifier si le format est conforme aux spécifications du cadastre
    const pattern = /^\d{8}[A-Z0-9]{2}\d{4}$/;
    return pattern.test(identifiant);
  }

  /**
   * Parse un identifiant parcellaire
   */
  private parseParcelId(identifiant: string): {
    codeInsee: string;
    section: string;
    numero: string;
  } | null {
    if (!this.isValidParcelId(identifiant)) {
      return null;
    }

    return {
      codeInsee: identifiant.substring(0, 5),
      section: identifiant.substring(8, 10),
      numero: identifiant.substring(10, 14),
    };
  }

  /**
   * Récupère une parcelle depuis l'API IGN
   */
  private async fetchParcelle(components: {
    codeInsee: string;
    section: string;
    numero: string;
  }): Promise<ApiResponse<IGNParcelleFeature>> {
    try {
      const url = `${this.baseUrl}/parcelle`;
      const params = {
        code_insee: components.codeInsee,
        section: components.section,
        numero: components.numero,
        source_ign: 'PCI',
      };

      console.log(`Appel API IGN parcelle: ${url}`, params);

      const response = await firstValueFrom(
        this.httpService.get<IGNParcelleResponse>(url, { params }),
      );

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: 'Parcelle non trouvée dans le cadastre',
          source: 'IGN Cadastre',
        };
      }

      return {
        success: true,
        data: data.features[0],
        source: 'IGN Cadastre',
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la parcelle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur API IGN',
        source: 'IGN Cadastre',
      };
    }
  }

  /**
   * Récupère le centroïde depuis l'API localisant
   */
  private async fetchLocalisant(components: {
    codeInsee: string;
    section: string;
    numero: string;
  }): Promise<ApiResponse<IGNLocalisantFeature>> {
    try {
      const url = `${this.baseUrl}/localisant`;
      const params = {
        code_insee: components.codeInsee,
        section: components.section,
        numero: components.numero,
        source_ign: 'PCI',
      };

      console.log(`Appel API IGN localisant: ${url}`, params);

      const response = await firstValueFrom(
        this.httpService.get<IGNLocalisantResponse>(url, { params }),
      );

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: 'Localisant non trouvé',
          source: 'IGN Cadastre',
        };
      }

      return {
        success: true,
        data: data.features[0],
        source: 'IGN Cadastre',
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du localisant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur API IGN',
        source: 'IGN Cadastre',
      };
    }
  }

  /**
   * Extrait les coordonnées depuis le localisant ou calcule depuis la géométrie
   */
  private extractCoordonnees(
    localisantResult: ApiResponse<IGNLocalisantFeature>,
    parcelle: IGNParcelleFeature,
  ): { latitude: number; longitude: number } {
    // Priorité 1: Utiliser le localisant si disponible
    if (localisantResult.success && localisantResult.data) {
      // Format: coordinates: [[longitude, latitude]]
      const [longitude, latitude] =
        localisantResult.data.geometry.coordinates[0];
      return { latitude, longitude };
    }

    // Fallback: Calculer depuis la géométrie de la parcelle
    console.warn(
      'Localisant non disponible, calcul centroïde depuis géométrie',
    );
    return this.calculateCentroid(parcelle.geometry);
  }

  /**
   * Calcule le centroïde d'un polygone (fallback)
   */
  private calculateCentroid(geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][];
  }): { latitude: number; longitude: number } {
    const coords =
      geometry.type === 'MultiPolygon'
        ? geometry.coordinates[0]
        : geometry.coordinates;

    if (!coords || coords.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    const ring = coords[0];
    let sumLat = 0;
    let sumLon = 0;
    let count = 0;

    for (const point of ring) {
      if (Array.isArray(point) && point.length >= 2) {
        const lon = point[0];
        const lat = point[1];

        sumLon += lon;
        sumLat += lat;
        count++;
      }
    }

    return {
      latitude: count > 0 ? sumLat / count : 0,
      longitude: count > 0 ? sumLon / count : 0,
    };
  }
}
