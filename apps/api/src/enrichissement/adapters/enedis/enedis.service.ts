import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

import { getAppConfig } from "../../../config";
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
  private readonly baseUrl = getAppConfig().externalApis.enedisUrl ?? ENEDIS_API_BASE_URL;
  private readonly timeoutMs = getAppConfig().externalApis.enedisTimeoutMs ?? ENEDIS_TIMEOUT_MS;

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
      // En zone urbaine dense, le réseau BT est souvent entièrement souterrain.
      const [lignesAeriennes, lignesSouterraines] = await Promise.all([
        this.rechercherLignesBT("reseau-bt", latitude, longitude, ENEDIS_RAYONS.LIGNES_BT),
        this.rechercherLignesBT(
          "reseau-souterrain-bt",
          latitude,
          longitude,
          ENEDIS_RAYONS.LIGNES_BT,
        ),
      ]);

      const posteProche = postesProches[0];
      const ligneBTProche = [...lignesAeriennes, ...lignesSouterraines].sort(
        (a, b) => a.distance - b.distance,
      )[0];

      // Recherche effectuée, aucune infrastructure dans les rayons : null, et surtout pas
      // une distance sentinelle qui remonterait telle quelle jusqu'à l'écran.
      if (!posteProche && !ligneBTProche) {
        return {
          success: true,
          source: ENEDIS_SOURCE,
          data: {
            distance: null,
            type: "HTA",
            capaciteDisponible: false,
          },
        };
      }

      let raccordementOptimal: EnedisRaccordement;

      if (ligneBTProche && (!posteProche || ligneBTProche.distance <= posteProche.distance)) {
        const raccordementDirect = ligneBTProche.distance < ENEDIS_SEUILS.RACCORDEMENT_BT;
        raccordementOptimal = {
          distance: ligneBTProche.distance,
          // Au-delà du seuil, une extension de réseau est nécessaire
          type: raccordementDirect ? "BT" : "HTA",
          capaciteDisponible: raccordementDirect,
          infrastructureProche: {
            type: "ligne_bt",
            distance: ligneBTProche.distance,
            tension: "BT",
          },
        };
      } else {
        const typeTension = posteProche.distance < ENEDIS_SEUILS.TYPE_BT_VS_HTA ? "BT" : "HTA";
        raccordementOptimal = {
          distance: posteProche.distance,
          type: typeTension,
          capaciteDisponible: posteProche.distance < ENEDIS_SEUILS.CAPACITE_DISPONIBLE,
          posteProche: {
            nom: `Poste ${posteProche.commune}`,
            commune: posteProche.commune,
            coordonnees: posteProche.coordonnees,
          },
          infrastructureProche: {
            type: "poste",
            distance: posteProche.distance,
            tension: typeTension,
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
      .map((record) => {
        const coordonnees = parserGeopoint(record._geopoint);
        if (!coordonnees) return null;
        return {
          distance:
            record._geo_distance ??
            calculateDistance(latitude, longitude, coordonnees.latitude, coordonnees.longitude),
          commune: record.nom_commune,
          coordonnees,
        };
      })
      .filter((poste) => poste !== null)
      .sort((a, b) => a.distance - b.distance);
  }

  // Une erreur sur un dataset BT ne doit pas faire échouer tout le raccordement.
  private async rechercherLignesBT(
    dataset: "reseau-bt" | "reseau-souterrain-bt",
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<Array<{ distance: number }>> {
    const params: EnedisApiParams = {
      dataset,
      size: ENEDIS_NOMBRE_RESULTATS.LIGNES_BT,
      geo_distance: `${longitude},${latitude},${rayonMetres}`,
    };

    try {
      const response = await this.callEnedisApi<EnedisLigneBTRecord>(params);

      // _geo_distance est la distance au tracé : le _geopoint d'une ligne n'en est qu'un point.
      return response.results
        .filter((record) => typeof record._geo_distance === "number")
        .map((record) => ({ distance: record._geo_distance as number }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Dataset ${dataset} non disponible: ${errorMessage}`);
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

// Data-Fair sert la géométrie en chaîne JSON ; _geopoint ("lat,lon") est plus simple à lire.
function parserGeopoint(geopoint?: string): { latitude: number; longitude: number } | null {
  const [latitude, longitude] = (geopoint ?? "").split(",").map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}
