import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import { ApiResponse } from "../shared/api-response.types";
import { IgnItineraireReponse, IgnItineraireResultat, PointWgs84 } from "./ign-itineraire.types";

const IGN_ITINERAIRE_URL = "https://data.geopf.fr/navigation/itineraire";
const IGN_ITINERAIRE_TIMEOUT_MS = 10000;
// Le service plafonne à ~10 requêtes/s par IP : une seule relance après la pause demandée.
const PAUSE_MAX_APRES_429_MS = 2000;

// Forme minimale d'une erreur Axios (axios n'est pas une dépendance directe de l'API)
interface ErreurHttp {
  response?: { status?: number; headers?: Record<string, string | undefined> };
}

/**
 * Adapter du calcul d'itinéraire IGN Géoplateforme (graphe BD TOPO, sans clé).
 * Doc : https://geoservices.ign.fr/documentation/services/services-geoplateforme/itineraire
 */
@Injectable()
export class IgnItineraireService {
  private readonly logger = new Logger(IgnItineraireService.name);

  constructor(private readonly httpService: HttpService) {}

  // Distance du plus court chemin en voiture (optimisation « shortest », pas « fastest »).
  async getDistanceRoutiere(
    depart: PointWgs84,
    arrivee: PointWgs84,
  ): Promise<ApiResponse<IgnItineraireResultat>> {
    const startTime = Date.now();
    const params = {
      resource: "bdtopo-osrm",
      profile: "car",
      optimization: "shortest",
      start: `${depart.longitude},${depart.latitude}`,
      end: `${arrivee.longitude},${arrivee.latitude}`,
      getSteps: "false",
      distanceUnit: "meter",
      geometryFormat: "geojson",
    };

    try {
      const data = await this.appeler(params);

      if (typeof data.distance !== "number" || !Number.isFinite(data.distance)) {
        throw new Error("Distance absente de la réponse d'itinéraire");
      }

      return {
        success: true,
        data: { distanceMetres: data.distance },
        source: "IGN Itinéraire",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.warn(`Erreur API itinéraire IGN : ${(error as Error).message}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API itinéraire IGN",
        source: "IGN Itinéraire",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  private async appeler(params: Record<string, string>): Promise<IgnItineraireReponse> {
    const requete = async (): Promise<IgnItineraireReponse> => {
      const response = await firstValueFrom(
        this.httpService.get<IgnItineraireReponse>(IGN_ITINERAIRE_URL, {
          params,
          timeout: IGN_ITINERAIRE_TIMEOUT_MS,
        }),
      );
      return response.data;
    };

    try {
      return await requete();
    } catch (error) {
      const reponse = (error as ErreurHttp).response;
      if (reponse?.status !== 429) throw error;

      const retryAfterS = Number(reponse.headers?.["retry-after"]);
      const pauseMs = Number.isFinite(retryAfterS)
        ? Math.min(retryAfterS * 1000, PAUSE_MAX_APRES_429_MS)
        : PAUSE_MAX_APRES_429_MS;
      await new Promise((resolve) => setTimeout(resolve, pauseMs));
      return requete();
    }
  }
}
