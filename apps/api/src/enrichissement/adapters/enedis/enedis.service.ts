import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

import { ApiResponse } from "../shared/api-response.types";
import {
  EnedisApiParams,
  EnedisApiResponse,
  EnedisLigneBTRecord,
  EnedisPosteElectriqueRecord,
  EnedisRaccordement,
} from "./enedis.types";

@Injectable()
export class EnedisService {
  private readonly logger = new Logger(EnedisService.name);
  private readonly baseUrl =
    process.env.ENEDIS_API_URL || "https://data.enedis.fr/api/explore/v2.1/catalog/datasets";

  private readonly timeout = parseInt(process.env.ENEDIS_API_TIMEOUT || "10000", 10);

  constructor(private readonly httpService: HttpService) {}

  async getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisRaccordement>> {
    try {
      // Recherche des postes dans un rayon de 5km
      const postesProches = await this.rechercherPostes(latitude, longitude, 5000);

      // Recherche des lignes BT dans un rayon de 500m
      const lignesBTProches = await this.rechercherLignesBT(latitude, longitude, 500);

      if (postesProches.length === 0 && lignesBTProches.length === 0) {
        return {
          success: true,
          source: "enedis-api",
          data: {
            distance: 999, // Distance très élevée pour indiquer l'absence d'infrastructure
            type: "HTA",
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
          type: "BT",
          capaciteDisponible: true,
          infrastructureProche: {
            type: "ligne_bt",
            distance: ligneBTProche.distance,
            tension: "BT",
          },
        };
      } else if (posteProche) {
        // Raccordement HTA/BT depuis le poste
        raccordementOptimal = {
          distance: posteProche.distance / 1000, // conversion en km
          type: posteProche.distance < 200 ? "BT" : "HTA",
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
            type: "poste",
            distance: posteProche.distance,
            tension: posteProche.distance < 200 ? "BT" : "HTA",
          },
        };
      } else {
        // Fallback - utilisation de la ligne BT la plus proche
        raccordementOptimal = {
          distance: ligneBTProche.distance / 1000,
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
        source: "enedis-api",
        data: raccordementOptimal,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(`Erreur calcul distance raccordement: ${errorMessage}`, (error as Error).stack);
      return {
        success: false,
        source: "enedis-api",
        error: "Erreur lors du calcul de la distance de raccordement",
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
      dataset: "poste-electrique",
      rows: 50,
      "geofilter.distance": `${latitude},${longitude},${rayonMetres}`,
    };

    const response = await this.callEnedisApi<EnedisPosteElectriqueRecord>(params);

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
      dataset: "reseau-bt",
      rows: 100,
      "geofilter.distance": `${latitude},${longitude},${rayonMetres}`,
    };

    try {
      const response = await this.callEnedisApi<EnedisLigneBTRecord>(params);

      return response.results
        .filter((record) => record.geo_point_2d) // Filtrer les enregistrements sans coordonnées
        .map((record) => ({
          distance: this.calculerDistance(
            latitude,
            longitude,
            record.geo_point_2d.lat,
            record.geo_point_2d.lon,
          ),
          type: record.nature || "BT",
          tension: record.tension || "BT",
        }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Dataset reseau-bt non disponible: ${errorMessage}`);
      return [];
    }
  }

  private async callEnedisApi<T>(params: EnedisApiParams): Promise<EnedisApiResponse<T>> {
    const { dataset, ...queryParams } = params;
    const url = `${this.baseUrl}/${dataset}/records`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params: queryParams }).pipe(
          timeout(this.timeout),
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

  private calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}
