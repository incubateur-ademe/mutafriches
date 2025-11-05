import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { centroid } from "@turf/centroid";
import { GeometrieParcelle, Coordonnees } from "@mutafriches/shared-types";
import type { Geometry } from "geojson";

import { ApiResponse } from "../shared/api-response.types";
import {
  CadastreServiceResponse,
  IGNLocalisantFeature,
  IGNLocalisantResponse,
  IGNParcelleFeature,
  IGNParcelleResponse,
} from "./cadastre.types";
import { isValidParcelId } from "../../../evaluation/utils/validation.utils";

@Injectable()
export class CadastreService {
  private readonly logger = new Logger(CadastreService.name);
  private readonly baseUrl =
    process.env.IGN_CADASTRE_API_URL || "https://apicarto.ign.fr/api/cadastre";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère les informations d'une parcelle par son identifiant
   */
  async getParcelleInfo(identifiant: string): Promise<ApiResponse<CadastreServiceResponse>> {
    const startTime = Date.now();

    try {
      if (!isValidParcelId(identifiant)) {
        return {
          success: false,
          error: `Format d'identifiant parcellaire invalide: ${identifiant}`,
          source: "IGN Cadastre",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const parcelComponents = this.parseParcelId(identifiant);
      if (!parcelComponents) {
        return {
          success: false,
          error: `Impossible de parser l'identifiant: ${identifiant}`,
          source: "IGN Cadastre",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const [parcelleResult, localisantResult] = await Promise.all([
        this.fetchParcelle(parcelComponents),
        this.fetchLocalisant(parcelComponents),
      ]);

      if (!parcelleResult.success || !parcelleResult.data) {
        return {
          success: false,
          error: parcelleResult.error || "Parcelle non trouvée",
          source: "IGN Cadastre",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const parcelle = parcelleResult.data;

      if (parcelle.properties.idu !== identifiant) {
        this.logger.warn(`IDU mismatch: demandé ${identifiant}, reçu ${parcelle.properties.idu}`);
      }

      // Coordonnées depuis localisant ou fallback
      const coordonnees = this.extractCoordonnees(localisantResult, parcelle);

      // Géométrie complète de la parcelle
      const geometrie = this.normalizeGeometry(parcelle.geometry);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Parcelle ${identifiant}: surface=${Math.round(parcelle.properties.contenance)}m², ` +
          `centroid=${coordonnees ? `lat=${coordonnees.latitude.toFixed(5)}, lon=${coordonnees.longitude.toFixed(5)}` : "KO"}, ` +
          `geometrie=${geometrie ? "OK" : "KO"}`,
      );

      return {
        success: true,
        data: {
          identifiant,
          codeInsee: parcelle.properties.code_insee,
          commune: parcelle.properties.nom_com,
          surface: Math.round(parcelle.properties.contenance),
          coordonnees,
          geometrie,
        },
        source: "IGN Cadastre",
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      this.logger.error(
        `Erreur lors de la récupération de la parcelle ${identifiant}:`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        source: "IGN Cadastre",
        responseTimeMs,
      };
    }
  }

  /**
   * Parse un identifiant parcellaire
   */
  private parseParcelId(identifiant: string): {
    codeInsee: string;
    section: string;
    numero: string;
  } | null {
    if (!isValidParcelId(identifiant)) {
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
        source_ign: "PCI",
      };

      const response = await firstValueFrom(
        this.httpService.get<IGNParcelleResponse>(url, { params }),
      );

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: "Parcelle non trouvée dans le cadastre",
          source: "IGN Cadastre",
        };
      }

      return {
        success: true,
        data: data.features[0],
        source: "IGN Cadastre",
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération de la parcelle:", (error as Error).stack);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API IGN",
        source: "IGN Cadastre",
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
        source_ign: "PCI",
      };

      const response = await firstValueFrom(
        this.httpService.get<IGNLocalisantResponse>(url, { params }),
      );

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: "Localisant non trouvé",
          source: "IGN Cadastre",
        };
      }

      return {
        success: true,
        data: data.features[0],
        source: "IGN Cadastre",
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération du localisant:", (error as Error).stack);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API IGN",
        source: "IGN Cadastre",
      };
    }
  }

  /**
   * Extrait les coordonnées depuis le localisant ou calcule avec turf.js
   */
  private extractCoordonnees(
    localisantResult: ApiResponse<IGNLocalisantFeature>,
    parcelle: IGNParcelleFeature,
  ): Coordonnees {
    // Priorité 1: Utiliser le localisant si disponible
    if (localisantResult.success && localisantResult.data) {
      const [longitude, latitude] = localisantResult.data.geometry.coordinates[0];
      return { latitude, longitude };
    }

    // Fallback: Calculer avec turf.js (plus précis)
    this.logger.warn("Localisant non disponible, calcul centroïde avec turf.js");
    return this.calculateCentroidWithTurf(parcelle.geometry);
  }

  /**
   * Calcule le centroïde avec turf
   */
  private calculateCentroidWithTurf(geometry: {
    type: "MultiPolygon" | "Polygon";
    coordinates: number[][][] | number[][][][];
  }): Coordonnees {
    try {
      // Cast explicite pour satisfaire Turf.js
      const feature = {
        type: "Feature" as const,
        geometry: geometry as unknown as Geometry,
        properties: {},
      };

      const center = centroid(feature);
      const [longitude, latitude] = center.geometry.coordinates;

      // Validation
      if (!this.isValidLatLon(latitude, longitude)) {
        this.logger.warn(`Centroid hors limites: lat=${latitude}, lon=${longitude}`);
        return this.calculateCentroidFallback(geometry);
      }

      return { latitude, longitude };
    } catch (error) {
      this.logger.warn(`Erreur turf.js, fallback manuel: ${(error as Error).message}`);
      return this.calculateCentroidFallback(geometry);
    }
  }

  /**
   * Calcule le centroïde manuellement (fallback si turf échoue)
   */
  private calculateCentroidFallback(geometry: {
    type: "MultiPolygon" | "Polygon";
    coordinates: number[][][] | number[][][][];
  }): Coordonnees {
    const coords =
      geometry.type === "MultiPolygon"
        ? (geometry.coordinates as number[][][][])[0]
        : (geometry.coordinates as number[][][]);

    if (!coords || coords.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    const ring = coords[0];
    let sumLat = 0;
    let sumLon = 0;
    let count = 0;

    for (const point of ring) {
      if (Array.isArray(point) && point.length >= 2) {
        const lon = point[0] as number;
        const lat = point[1] as number;

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

  /**
   * Normalise la géométrie au format GeometrieParcelle
   */
  private normalizeGeometry(geometry: {
    type: "MultiPolygon" | "Polygon";
    coordinates: number[][][] | number[][][][];
  }): GeometrieParcelle {
    return {
      type: geometry.type,
      coordinates: geometry.coordinates,
    };
  }

  /**
   * Valide les coordonnées GPS
   */
  private isValidLatLon(latitude: number, longitude: number): boolean {
    // France métropolitaine
    const isFranceMetro = latitude >= 41 && latitude <= 51 && longitude >= -5 && longitude <= 10;

    // DOM-TOM (validation large)
    const isDomTom = latitude >= -22 && latitude <= 50 && longitude >= -180 && longitude <= 180;

    return isFranceMetro || isDomTom;
  }
}
