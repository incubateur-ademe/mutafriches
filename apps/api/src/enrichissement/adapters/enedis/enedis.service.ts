import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

import { ApiResponse } from "../shared/api-response.types";
import { calculateDistance } from "../shared/distance.utils";
import {
  EnedisApiParams,
  EnedisApiResponse,
  EnedisLigneBTRecord,
  EnedisPosteElectriqueRecord,
} from "./enedis.api.types";
import { EnedisRaccordement } from "./enedis.types";
import {
  ENEDIS_API_BASE_URL,
  ENEDIS_RAYONS,
  ENEDIS_SEUILS,
  ENEDIS_NOMBRE_RESULTATS,
  ENEDIS_SOURCE,
  ENEDIS_TIMEOUT_MS,
} from "./enedis.constants";

@Injectable()
export class EnedisService {
  private readonly logger = new Logger(EnedisService.name);
  private readonly baseUrl = process.env.ENEDIS_API_URL || ENEDIS_API_BASE_URL;
  private readonly timeoutMs = parseInt(
    process.env.ENEDIS_API_TIMEOUT || String(ENEDIS_TIMEOUT_MS),
    10,
  );

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fonction pour obtenir la distance de raccordement la plus proche
   * @param latitude
   * @param longitude
   * @returns
   */
  async getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisRaccordement>> {
    try {
      const postesProches = await this.rechercherPostes(latitude, longitude, ENEDIS_RAYONS.POSTES);
      const lignesBTProches = await this.rechercherLignesBT(
        latitude,
        longitude,
        ENEDIS_RAYONS.LIGNES_BT,
      );

      if (postesProches.length === 0 && lignesBTProches.length === 0) {
        return {
          success: true,
          source: ENEDIS_SOURCE,
          data: {
            distance: ENEDIS_SEUILS.DISTANCE_DEFAUT,
            type: "HTA",
            capaciteDisponible: false,
          },
        };
      }

      // Calcul de la distance minimale et du type optimal
      const posteProche = postesProches[0];
      const ligneBTProche = lignesBTProches[0];

      let raccordementOptimal: EnedisRaccordement;

      if (ligneBTProche && ligneBTProche.distance < ENEDIS_SEUILS.RACCORDEMENT_BT) {
        raccordementOptimal = {
          distance: ligneBTProche.distance,
          type: "BT",
          capaciteDisponible: true,
          infrastructureProche: {
            type: "ligne_bt",
            distance: ligneBTProche.distance,
            tension: "BT",
          },
        };
      } else if (posteProche) {
        const typeTension = posteProche.distance < ENEDIS_SEUILS.TYPE_BT_VS_HTA ? "BT" : "HTA";
        raccordementOptimal = {
          distance: posteProche.distance,
          type: typeTension,
          capaciteDisponible: posteProche.distance < ENEDIS_SEUILS.CAPACITE_DISPONIBLE,
          posteProche: {
            nom: `Poste ${posteProche.commune}`,
            commune: posteProche.commune,
            coordonnees: {
              latitude: posteProche.coordonnees.latitude,
              longitude: posteProche.coordonnees.longitude,
            },
          },
          infrastructureProche: {
            type: "poste",
            distance: posteProche.distance,
            tension: typeTension,
          },
        };
      } else {
        // Fallback - utilisation de la ligne BT la plus proche
        raccordementOptimal = {
          distance: ligneBTProche.distance,
          type: "HTA", // Extension de réseau nécessaire
          capaciteDisponible: false,
          infrastructureProche: {
            type: "ligne_bt",
            distance: ligneBTProche.distance,
            tension: "BT",
          },
        };
      }

      return {
        success: true,
        source: ENEDIS_SOURCE,
        data: raccordementOptimal,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(
        `Erreur calcul distance raccordement: ${errorMessage}`,
        (error as Error).stack,
      );
      return {
        success: false,
        source: ENEDIS_SOURCE,
        error: "Erreur lors du calcul de la distance de raccordement",
      };
    }
  }

  /**
   * Fonction pour rechercher les postes électriques proches
   * @param latitude
   * @param longitude
   * @param rayonMetres
   * @returns
   */
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
      dataset: "poste-electrique",
      size: ENEDIS_NOMBRE_RESULTATS.POSTES,
      geo_distance: `${longitude},${latitude},${rayonMetres}`,
    };

    const response = await this.callEnedisApi<EnedisPosteElectriqueRecord>(params);

    return response.results
      .filter((record) => record.geometry?.coordinates)
      .map((record) => {
        const coords = record.geometry.coordinates as [number, number];
        return {
          distance:
            record._geo_distance ?? calculateDistance(latitude, longitude, coords[1], coords[0]),
          commune: record.nom_commune,
          coordonnees: {
            latitude: coords[1],
            longitude: coords[0],
          },
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Fonction pour rechercher les lignes BT proches
   * @param latitude
   * @param longitude
   * @param rayonMetres
   * @returns
   */
  private async rechercherLignesBT(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<Array<{ distance: number; type: string; tension: string }>> {
    const params: EnedisApiParams = {
      dataset: "reseau-bt",
      size: ENEDIS_NOMBRE_RESULTATS.LIGNES_BT,
      geo_distance: `${longitude},${latitude},${rayonMetres}`,
    };

    try {
      const response = await this.callEnedisApi<EnedisLigneBTRecord>(params);

      return response.results
        .filter((record) => record.geometry?.coordinates || record._geo_distance !== undefined)
        .map((record) => {
          // Utiliser _geo_distance fourni par l'API si disponible
          let distance = record._geo_distance;
          if (distance === undefined && record.geometry?.coordinates) {
            const coords = record.geometry.coordinates;
            if (Array.isArray(coords[0])) {
              const firstPoint = coords[0] as [number, number];
              distance = calculateDistance(latitude, longitude, firstPoint[1], firstPoint[0]);
            } else {
              const point = coords as [number, number];
              distance = calculateDistance(latitude, longitude, point[1], point[0]);
            }
          }
          return {
            distance: distance ?? 0,
            type: "BT",
            tension: "BT",
          };
        })
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Dataset reseau-bt non disponible: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Fonction générique pour appeler l'API Enedis
   * @param params
   * @returns
   */
  private async callEnedisApi<T>(params: EnedisApiParams): Promise<EnedisApiResponse<T>> {
    const { dataset, ...queryParams } = params;
    const url = `${this.baseUrl}/${dataset}/lines`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params: queryParams }).pipe(
          timeout(this.timeoutMs),
          catchError((error) => {
            const errorMessage = error instanceof Error ? error.message : "Erreur API inconnue";
            throw new HttpException(
              `Erreur API Enedis: ${errorMessage}`,
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data as EnedisApiResponse<T>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(`Erreur appel API Enedis: ${errorMessage}`);
      throw error;
    }
  }
}
