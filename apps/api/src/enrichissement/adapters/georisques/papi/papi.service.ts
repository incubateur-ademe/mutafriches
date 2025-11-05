import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  PapiApiResponse,
  PapiResultNormalized,
  PapiSearchParams,
  PapiNormalized,
  PapiItem,
} from "./papi.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class PapiService {
  private readonly logger = new Logger(PapiService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les PAPI (Programmes d'Actions de Prévention des Inondations) pour une localisation
   */
  async getPapi(params: PapiSearchParams): Promise<ApiResponse<PapiResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.PAPI}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || 1000; // Rayon par défaut de 1000m

      this.logger.debug(`Appel API PAPI: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<PapiApiResponse>(url, {
          params: {
            latlon,
            rayon,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (pas de PAPI)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucun PAPI pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: PapiResultNormalized = {
          exposition: false,
          nombrePapi: 0,
          papi: [],
          risquesUniques: [],
          communesConcernees: [],
          papiEnCours: 0,
          papiTermines: 0,
          source: GEORISQUES_SOURCES.PAPI,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.PAPI,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizePapiData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `PAPI: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombrePapi} PAPI (${normalized.papiEnCours} en cours, ${normalized.papiTermines} terminés)`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.PAPI,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API PAPI pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.PAPI,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API PAPI
   */
  private normalizePapiData(data: PapiApiResponse): PapiResultNormalized {
    const items = data.data || [];

    // Normaliser chaque PAPI
    const papiNormalises = items.map((item) => this.normalizePapi(item));

    // Extraire les risques uniques
    const risquesUniques = [
      ...new Set(
        items.flatMap((item) =>
          (item.liste_libelle_risque || []).map((r) => r.libelle_risque_long),
        ),
      ),
    ];

    // Extraire les communes concernées
    const communesConcernees = [...new Set(items.map((item) => item.libelle_commune))];

    // Compter les PAPI en cours et terminés
    const papiEnCours = papiNormalises.filter((p) => p.statut === "En cours").length;
    const papiTermines = papiNormalises.filter((p) => p.statut === "Terminé").length;

    return {
      exposition: items.length > 0,
      nombrePapi: items.length,
      papi: papiNormalises,
      risquesUniques,
      communesConcernees,
      papiEnCours,
      papiTermines,
      source: GEORISQUES_SOURCES.PAPI,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un PAPI individuel
   */
  private normalizePapi(item: PapiItem): PapiNormalized {
    const statut = this.determinerStatut(
      item.date_labellisation,
      item.date_signature,
      item.date_fin_realisation,
    );

    return {
      codeNational: item.code_national_papi,
      libelle: item.libelle_papi,
      risques: (item.liste_libelle_risque || []).map((r) => r.libelle_risque_long),
      bassinRisques: item.libelle_bassin_risques || "Non renseigné",
      codeInsee: item.code_insee,
      commune: item.libelle_commune,
      dateLabellisation: item.date_labellisation || null,
      dateSignature: item.date_signature || null,
      dateFinRealisation: item.date_fin_realisation || null,
      statut,
    };
  }

  /**
   * Détermine le statut d'un PAPI en fonction des dates
   */
  private determinerStatut(
    dateLabellisation: string,
    dateSignature: string,
    dateFinRealisation: string,
  ): "En cours" | "Terminé" | "Labellisé" | "Inconnu" {
    const maintenant = new Date();

    // Si date de fin de réalisation existe et est passée
    if (dateFinRealisation) {
      const finRealisation = new Date(dateFinRealisation);
      if (finRealisation <= maintenant) {
        return "Terminé";
      }
    }

    // Si date de signature existe, le PAPI est en cours
    if (dateSignature) {
      return "En cours";
    }

    // Si seule la date de labellisation existe
    if (dateLabellisation) {
      return "Labellisé";
    }

    return "Inconnu";
  }
}
