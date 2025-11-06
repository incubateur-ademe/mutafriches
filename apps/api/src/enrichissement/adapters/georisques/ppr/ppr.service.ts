import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  PprApiResponse,
  PprResultNormalized,
  PprSearchParams,
  PprNormalized,
  PprItem,
  PprCodeEtat,
} from "./ppr.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

/**
 * Service pour l'API PPR (Plan de Prévention des Risques)
 * ⚠️ ATTENTION: API est marquée comme OBSOLETE dans la documentation GeoRisques
 */
@Injectable()
export class PprService {
  private readonly logger = new Logger(PprService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;

    this.logger.warn(
      "Le service PPR utilise une API marquée comme OBSOLETE par GeoRisques. " +
        "Considérez l'utilisation d'alternatives si disponibles.",
    );
  }

  /**
   * Récupère les PPR (Plans de Prévention des Risques) pour une localisation
   */
  async getPpr(params: PprSearchParams): Promise<ApiResponse<PprResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.PPR}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || 1000; // Rayon par défaut de 1000m

      const queryParams: Record<string, string | number> = {
        latlon,
        rayon,
      };

      // Ajouter les filtres optionnels
      if (params.codeEtat) {
        queryParams.code_etat = params.codeEtat;
      }
      if (params.codeRisque) {
        queryParams.code_risque = params.codeRisque;
      }

      this.logger.debug(
        `Appel API PPR: ${url}?latlon=${latlon}&rayon=${rayon}` +
          `${params.codeEtat ? `&code_etat=${params.codeEtat}` : ""}` +
          `${params.codeRisque ? `&code_risque=${params.codeRisque}` : ""}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<PprApiResponse>(url, {
          params: queryParams,
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (pas de PPR)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucun PPR pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: PprResultNormalized = {
          exposition: false,
          nombrePpr: 0,
          ppr: [],
          typesRisquesUniques: [],
          pprActifs: 0,
          pprPrescrits: 0,
          pprAbroges: 0,
          communesConcernees: [],
          source: GEORISQUES_SOURCES.PPR,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.PPR,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizePprData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `PPR: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombrePpr} PPR (${normalized.pprActifs} actifs, ${normalized.pprPrescrits} prescrits)`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.PPR,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API PPR pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.PPR,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API PPR
   */
  private normalizePprData(data: PprApiResponse): PprResultNormalized {
    const items = data.data || [];

    // Normaliser chaque PPR
    const pprNormalises = items.map((item) => this.normalizePpr(item));

    // Extraire les types de risques uniques
    const typesRisquesUniques = [...new Set(items.map((item) => item.risque.libelle_risque))];

    // Extraire les communes concernées
    const communesConcernees = [...new Set(items.map((item) => item.libelle_commune))];

    // Compter les PPR par état
    const pprActifs = pprNormalises.filter((p) => p.estActif).length;
    const pprPrescrits = pprNormalises.filter((p) => p.codeEtat === PprCodeEtat.PRESCRIT).length;
    const pprAbroges = pprNormalises.filter((p) => p.codeEtat === PprCodeEtat.ABROGE).length;

    return {
      exposition: items.length > 0,
      nombrePpr: items.length,
      ppr: pprNormalises,
      typesRisquesUniques,
      pprActifs,
      pprPrescrits,
      pprAbroges,
      communesConcernees,
      source: GEORISQUES_SOURCES.PPR,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un PPR individuel
   */
  private normalizePpr(item: PprItem): PprNormalized {
    // Déterminer si le PPR est actif
    const estActif =
      item.etat.code_etat === PprCodeEtat.APPROUVE ||
      item.etat.code_etat === PprCodeEtat.APPLIQUE_PAR_ANTICIPATION;

    // Extraire les classes d'aléa
    const classesAlea = (item.risque.classes_alea || []).map((c) => c.libelle);

    return {
      idGaspar: item.id_gaspar,
      nom: item.nom_ppr,
      etat: item.etat.libelle_etat,
      codeEtat: item.etat.code_etat,
      typeRisque: item.risque.libelle_risque,
      codeRisque: item.risque.code_risque,
      classesAlea,
      commune: item.libelle_commune,
      dateApprobation: item.date_approbation || null,
      dateFinValidite: item.date_fin_validite || null,
      estActif,
    };
  }
}
