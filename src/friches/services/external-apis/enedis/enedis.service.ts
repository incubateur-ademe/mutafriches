import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  IEnedisService,
  EnedisRaccordement,
  EnedisConnexionStatus,
  EnedisAnalyseComplete,
} from './enedis.interface';
import {
  EnedisApiResponse,
  EnedisPosteElectriqueRecord,
  EnedisLigneBTRecord,
  EnedisPoteauRecord,
  EnedisApiParams,
} from './enedis-api.interfaces';
import { ApiResponse } from '../shared/api-response.interface';

@Injectable()
export class EnedisService implements IEnedisService {
  private readonly baseUrl =
    'https://data.enedis.fr/api/explore/v2.1/catalog/datasets';
  private readonly timeout = 10000; // 10 secondes

  constructor(private readonly httpService: HttpService) {}

  async getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisRaccordement>> {
    try {
      console.log(
        `Calcul distance raccordement pour: ${latitude}, ${longitude}`,
      );

      // Recherche des postes dans un rayon de 5km
      const postesProches = await this.rechercherPostes(
        latitude,
        longitude,
        5000,
      );

      // Recherche des lignes BT dans un rayon de 500m
      const lignesBTProches = await this.rechercherLignesBT(
        latitude,
        longitude,
        500,
      );

      if (postesProches.length === 0 && lignesBTProches.length === 0) {
        return {
          success: true,
          source: 'enedis-api',
          data: {
            distance: 999, // Distance très élevée pour indiquer l'absence d'infrastructure
            type: 'HTA',
            capaciteDisponible: false,
          },
        };
      }

      // Calcul de la distance minimale et du type optimal
      const posteProche = postesProches[0];
      const ligneBTProche = lignesBTProches[0];

      let raccordementOptimal: EnedisRaccordement;

      if (ligneBTProche && ligneBTProche.distance < 100) {
        // Raccordement BT possible (moins de 100m d'une ligne BT)
        raccordementOptimal = {
          distance: ligneBTProche.distance / 1000, // conversion en km
          type: 'BT',
          capaciteDisponible: true,
          infrastructureProche: {
            type: 'ligne_bt',
            distance: ligneBTProche.distance,
            tension: 'BT',
          },
        };
      } else if (posteProche) {
        // Raccordement HTA/BT depuis le poste
        raccordementOptimal = {
          distance: posteProche.distance / 1000, // conversion en km
          type: posteProche.distance < 200 ? 'BT' : 'HTA',
          capaciteDisponible: posteProche.distance < 1000, // Estimation capacité
          posteProche: {
            nom: `Poste ${posteProche.commune}`,
            commune: posteProche.commune,
            coordonnees: {
              latitude: posteProche.coordonnees.latitude,
              longitude: posteProche.coordonnees.longitude,
            },
          },
          infrastructureProche: {
            type: 'poste',
            distance: posteProche.distance,
            tension: posteProche.distance < 200 ? 'BT' : 'HTA',
          },
        };
      } else {
        // Fallback - utilisation de la ligne BT la plus proche
        raccordementOptimal = {
          distance: ligneBTProche.distance / 1000,
          type: 'HTA', // Extension de réseau nécessaire
          capaciteDisponible: false,
          infrastructureProche: {
            type: 'ligne_bt',
            distance: ligneBTProche.distance,
            tension: 'BT',
          },
        };
      }

      return {
        success: true,
        source: 'enedis-api',
        data: raccordementOptimal,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(
        `Erreur calcul distance raccordement: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        source: 'enedis-api',
        error: 'Erreur lors du calcul de la distance de raccordement',
      };
    }
  }

  async checkConnection(
    identifiantParcelle: string,
    coordonnees?: { latitude: number; longitude: number },
  ): Promise<ApiResponse<EnedisConnexionStatus>> {
    try {
      console.log(
        `Vérification connexion pour parcelle: ${identifiantParcelle}`,
      );

      // Si pas de coordonnées fournies, impossible de faire la vérification
      if (!coordonnees) {
        return {
          success: false,
          source: 'enedis-api',
          error:
            'Coordonnées de la parcelle requises pour la vérification de connexion',
        };
      }

      const { latitude, longitude } = coordonnees;

      // Recherche dans différents rayons pour évaluer la connectivité
      const [postesProches, lignesBT, poteaux] = await Promise.all([
        this.rechercherPostes(latitude, longitude, 2000),
        this.rechercherLignesBT(latitude, longitude, 100),
        this.rechercherPoteaux(latitude, longitude, 50),
      ]);

      const isConnected =
        postesProches.length > 0 || lignesBT.length > 0 || poteaux.length > 0;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (lignesBT.length > 0 || poteaux.length > 0) {
        confidence = 'high';
      } else if (postesProches.length > 0) {
        confidence = 'medium';
      }

      const sources: string[] = [];
      if (postesProches.length > 0) sources.push('postes-electriques');
      if (lignesBT.length > 0) sources.push('reseau-bt');
      if (poteaux.length > 0) sources.push('poteaux-hta-bt');

      const connexionStatus: EnedisConnexionStatus = {
        isConnected,
        confidence,
        sources,
        details: {
          postesProches: postesProches.length,
          lignesBTProches: lignesBT.length,
          poteauxProches: poteaux.length,
        },
      };

      return {
        success: true,
        source: 'enedis-api',
        data: connexionStatus,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(
        `Erreur vérification connexion: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        source: 'enedis-api',
        error: 'Erreur lors de la vérification de connexion',
      };
    }
  }

  async analyseComplete(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisAnalyseComplete>> {
    try {
      console.log(`Analyse complète pour: ${latitude}, ${longitude}`);

      // Exécution des analyses en parallèle
      const [raccordementResult, connexionResult] = await Promise.all([
        this.getDistanceRaccordement(latitude, longitude),
        this.checkConnection('parcelle-temp', { latitude, longitude }), // Passer les coordonnées
      ]);

      if (!raccordementResult.success || !connexionResult.success) {
        return {
          success: false,
          source: 'enedis-api',
          error: "Erreur lors de l'analyse complète",
        };
      }

      const raccordement = raccordementResult.data as EnedisRaccordement;
      const connexion = connexionResult.data as EnedisConnexionStatus;

      // Génération des recommandations
      const recommandations = this.genererRecommandations(
        raccordement,
        connexion,
      );

      // Estimation des coûts (basée sur les distances et types)
      const coutEstime = this.estimerCouts(raccordement);

      const analyseComplete: EnedisAnalyseComplete = {
        raccordement,
        connexion,
        recommandations,
        coutEstime,
      };

      return {
        success: true,
        source: 'enedis-api',
        data: analyseComplete,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`Erreur analyse complète: ${errorMessage}`, errorStack);
      return {
        success: false,
        source: 'enedis-api',
        error: "Erreur lors de l'analyse complète",
      };
    }
  }

  async rechercherInfrastructures(
    latitude: number,
    longitude: number,
    rayonMetres: number = 1000,
  ): Promise<
    ApiResponse<{
      postes: Array<{ distance: number; nom: string; commune: string }>;
      lignesBT: Array<{ distance: number; type: string; tension: string }>;
      poteaux: Array<{ distance: number; tension: string }>;
    }>
  > {
    try {
      console.log(`Recherche infrastructures dans rayon ${rayonMetres}m`);

      const [postesData, lignesData, poteauxData] = await Promise.all([
        this.rechercherPostes(latitude, longitude, rayonMetres),
        this.rechercherLignesBT(latitude, longitude, rayonMetres),
        this.rechercherPoteaux(latitude, longitude, rayonMetres),
      ]);

      return {
        success: true,
        source: 'enedis-api',
        data: {
          postes: postesData.map((p) => ({
            distance: p.distance,
            nom: `Poste ${p.commune}`,
            commune: p.commune,
          })),
          lignesBT: lignesData.map((l) => ({
            distance: l.distance,
            type: l.type || 'BT',
            tension: l.tension || 'BT',
          })),
          poteaux: poteauxData.map((p) => ({
            distance: p.distance,
            tension: p.tension || 'BT',
          })),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(
        `Erreur recherche infrastructures: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        source: 'enedis-api',
        error: "Erreur lors de la recherche d'infrastructures",
      };
    }
  }

  private async rechercherPostes(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<
    Array<{
      distance: number;
      commune: string;
      coordonnees: { latitude: number; longitude: number };
    }>
  > {
    const params: EnedisApiParams = {
      dataset: 'poste-electrique',
      rows: 50,
      'geofilter.distance': `${latitude},${longitude},${rayonMetres}`,
    };

    const response =
      await this.callEnedisApi<EnedisPosteElectriqueRecord>(params);

    return response.results
      .map((record) => ({
        distance: this.calculerDistance(
          latitude,
          longitude,
          record.geo_point_2d.lat,
          record.geo_point_2d.lon,
        ),
        commune: record.nom_commune,
        coordonnees: {
          latitude: record.geo_point_2d.lat,
          longitude: record.geo_point_2d.lon,
        },
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  private async rechercherLignesBT(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<Array<{ distance: number; type: string; tension: string }>> {
    const params: EnedisApiParams = {
      dataset: 'reseau-bt',
      rows: 100,
      'geofilter.distance': `${latitude},${longitude},${rayonMetres}`,
    };

    try {
      const response = await this.callEnedisApi<EnedisLigneBTRecord>(params);

      return response.results
        .filter((record) => record.geo_point_2d) // Filtrer les enregistrements sans coordonnées
        .map((record) => ({
          distance: this.calculerDistance(
            latitude,
            longitude,
            record.geo_point_2d!.lat,
            record.geo_point_2d!.lon,
          ),
          type: record.nature || 'BT',
          tension: record.tension || 'BT',
        }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      console.warn(`Dataset reseau-bt non disponible: ${errorMessage}`);
      return [];
    }
  }

  private async rechercherPoteaux(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<Array<{ distance: number; tension: string }>> {
    const params: EnedisApiParams = {
      dataset: 'position-geographique-des-poteaux-hta-et-bt',
      rows: 50,
      'geofilter.distance': `${latitude},${longitude},${rayonMetres}`,
    };

    try {
      const response = await this.callEnedisApi<EnedisPoteauRecord>(params);

      return response.results
        .filter((record) => record.geo_point_2d)
        .map((record) => ({
          distance: this.calculerDistance(
            latitude,
            longitude,
            record.geo_point_2d!.lat,
            record.geo_point_2d!.lon,
          ),
          tension: record.tension || 'BT',
        }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      console.warn(`Dataset poteaux non disponible: ${errorMessage}`);
      return [];
    }
  }

  // ========== Méthodes utilitaires ==========

  private async callEnedisApi<T>(
    params: EnedisApiParams,
  ): Promise<EnedisApiResponse<T>> {
    const { dataset, ...queryParams } = params;
    const url = `${this.baseUrl}/${dataset}/records`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params: queryParams }).pipe(
          timeout(this.timeout),
          catchError((error) => {
            const errorMessage =
              error instanceof Error ? error.message : 'Erreur API inconnue';
            throw new HttpException(
              `Erreur API Enedis: ${errorMessage}`,
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data as EnedisApiResponse<T>;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Erreur appel API Enedis: ${errorMessage}`);
      throw error;
    }
  }

  private calculerDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private genererRecommandations(
    raccordement: EnedisRaccordement,
    connexion: EnedisConnexionStatus,
  ): string[] {
    const recommandations: string[] = [];

    if (raccordement.distance < 0.05) {
      // Moins de 50m
      recommandations.push(
        'Raccordement très favorable - Infrastructure à proximité immédiate',
      );
    } else if (raccordement.distance < 0.2) {
      // Moins de 200m
      recommandations.push(
        'Raccordement favorable - Extension courte nécessaire',
      );
    } else if (raccordement.distance < 1) {
      // Moins de 1km
      recommandations.push(
        'Raccordement modéré - Extension moyenne du réseau nécessaire',
      );
    } else {
      recommandations.push(
        'Raccordement coûteux - Extension importante du réseau requise',
      );
    }

    if (raccordement.type === 'BT' && raccordement.capaciteDisponible) {
      recommandations.push('Raccordement BT possible - Procédure simplifiée');
    } else {
      recommandations.push(
        'Raccordement HTA nécessaire - Étude technique approfondie requise',
      );
    }

    if (connexion.confidence === 'low') {
      recommandations.push(
        'Données limitées - Contacter Enedis pour une pré-étude officielle',
      );
    }

    recommandations.push(
      'Respecter la réglementation DT-DICT avant tous travaux',
    );

    return recommandations;
  }

  private estimerCouts(raccordement: EnedisRaccordement): {
    min: number;
    max: number;
    devise: 'EUR';
    commentaire: string;
  } {
    let coutMin = 1000; // Coût minimum de raccordement
    let coutMax = 3000;

    // Ajustement selon la distance
    if (raccordement.distance > 0.1) {
      const coutExtension =
        raccordement.distance * (raccordement.type === 'BT' ? 100 : 200) * 1000;
      coutMin += coutExtension * 0.8;
      coutMax += coutExtension * 1.5;
    }

    // Ajustement selon le type
    if (raccordement.type === 'HTA') {
      coutMin += 2000;
      coutMax += 8000;
    }

    return {
      min: Math.round(coutMin),
      max: Math.round(coutMax),
      devise: 'EUR',
      commentaire: 'Estimation indicative - Devis officiel Enedis requis',
    };
  }
}
