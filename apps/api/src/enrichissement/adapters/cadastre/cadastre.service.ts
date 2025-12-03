import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { centroid } from "@turf/centroid";
import {
  GeometrieParcelle,
  Coordonnees,
  isValidParcelId,
  normalizeParcelId,
  resolveCodeInseeArrondissement,
} from "@mutafriches/shared-types";
import type { Geometry } from "geojson";

import { ApiResponse } from "../shared/api-response.types";
import {
  CadastreServiceResponse,
  IGNLocalisantFeature,
  IGNLocalisantResponse,
  IGNParcelleFeature,
  IGNParcelleResponse,
} from "./cadastre.types";

@Injectable()
export class CadastreService {
  private readonly logger = new Logger(CadastreService.name);
  private readonly baseUrl = "https://apicarto.ign.fr/api/cadastre";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère les informations d'une parcelle par son identifiant
   * Normalise automatiquement l'IDU avant traitement
   */
  async getParcelleInfo(identifiant: string): Promise<ApiResponse<CadastreServiceResponse>> {
    const startTime = Date.now();

    try {
      // Valider l'IDU brut
      if (!isValidParcelId(identifiant)) {
        return {
          success: false,
          error: `Format d'identifiant parcellaire invalide: ${identifiant}`,
          source: "IGN Cadastre",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normaliser l'IDU (retire zéros superflus avant section)
      const normalizedIdentifiant = normalizeParcelId(identifiant);
      if (normalizedIdentifiant !== identifiant) {
        this.logger.debug(`IDU normalisé: ${identifiant} → ${normalizedIdentifiant}`);
      }

      // Parser l'IDU normalisé
      const parcelComponents = this.parseParcelId(normalizedIdentifiant);
      if (!parcelComponents) {
        return {
          success: false,
          error: `Impossible de parser l'identifiant: ${normalizedIdentifiant}`,
          source: "IGN Cadastre",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Récupérer les données en parallèle
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

      // Vérifier que l'IDU retourné correspond après normalisation
      const iduReturned = parcelle.properties.idu as string;
      const normalizedIduReturned = normalizeParcelId(iduReturned);

      if (normalizedIduReturned !== normalizedIdentifiant) {
        this.logger.warn(
          `IDU mismatch: demandé ${normalizedIdentifiant}, reçu ${normalizedIduReturned}`,
        );
      }

      // Coordonnées depuis localisant ou fallback
      const coordonnees = this.extractCoordonnees(localisantResult, parcelle);

      // Géométrie complète de la parcelle
      const geometrie = this.normalizeGeometry(parcelle.geometry);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Parcelle ${normalizedIdentifiant}: surface=${Math.round(parcelle.properties.contenance)}m², ` +
          `centroid=${coordonnees ? `lat=${coordonnees.latitude.toFixed(5)}, lon=${coordonnees.longitude.toFixed(5)}` : "KO"}, ` +
          `geometrie=${geometrie ? "OK" : "KO"}`,
      );

      return {
        success: true,
        data: {
          identifiant: normalizedIdentifiant,
          codeInsee: parcelle.properties.code_insee as string,
          commune: parcelle.properties.nom_com as string,
          surface: Math.round(parcelle.properties.contenance as number),
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
   * Parse un identifiant parcellaire normalisé pour l'appel à l'API IGN Cadastre
   *
   * Format après normalisation :
   * - DEPT(2-3) + COMMUNE(3) + COM_ABS(3) + SECTION(1-2) + NUMERO(4)
   * - Longueur totale : 13-15 caractères
   *
   * IMPORTANT:
   * 1. L'API IGN exige que la section fasse TOUJOURS 2 caractères (padding avec zéro si besoin)
   * 2. Les codes INSEE d'arrondissements sont résolus en codes communes uniques :
   *    - Paris : 75101-75120 → 75056
   *    - Marseille : 13201-13216 → 13055
   *    - Lyon : 69381-69389 → 69123
   *    (Voir resolveCodeInseeArrondissement dans shared-types)
   */
  private parseParcelId(identifiant: string): {
    codeInsee: string;
    section: string;
    numero: string;
    iduComplet: string;
  } | null {
    if (!isValidParcelId(identifiant)) {
      this.logger.warn(`IDU invalide: ${identifiant}`);
      return null;
    }

    // Identifier la longueur du département
    let deptLen = 2;
    if (identifiant[0] === "9" && (identifiant[1] === "7" || identifiant[1] === "8")) {
      deptLen = 3; // DOM (971-976)
    } else if (
      (identifiant[0] === "2" || identifiant[0] === "9") &&
      (identifiant[1] === "A" || identifiant[1] === "B")
    ) {
      deptLen = 2; // Corse (2A, 2B)
    }

    // Code INSEE = département + commune (toujours 3 chiffres)
    let codeInsee = identifiant.substring(0, deptLen + 3);

    // Résoudre les arrondissements (Paris, Lyon, Marseille)
    const resolution = resolveCodeInseeArrondissement(codeInsee);
    if (resolution.wasTransformed) {
      this.logger.debug(
        `${resolution.ville}: code ${codeInsee} → code_insee ${resolution.resolved}`,
      );
      codeInsee = resolution.resolved;
    }

    // Numéro de parcelle = toujours les 4 derniers caractères
    const numero = identifiant.substring(identifiant.length - 4);

    // COM_ABS + SECTION = tout ce qui reste entre commune et numéro
    const comAbsAndSection = identifiant.substring(deptLen + 3, identifiant.length - 4);

    // COM_ABS fait toujours 3 caractères
    // SECTION fait 1 ou 2 caractères (le reste après COM_ABS)
    if (comAbsAndSection.length < 4) {
      this.logger.warn(
        `Format IDU invalide: comAbsAndSection trop court (${comAbsAndSection.length} car)`,
      );
      return null;
    }

    let section = comAbsAndSection.substring(3); // Section = après les 3 premiers caractères du COM_ABS

    // CRITIQUE: L'API IGN exige que la section fasse TOUJOURS 2 caractères
    // Si section = 1 caractère, padder avec un zéro devant
    if (section.length === 1) {
      section = `0${section}`;
    }

    // Log pour debug
    if (process.env.NODE_ENV !== "production") {
      this.logger.debug(
        `IDU parsé: ${identifiant} → codeInsee=${codeInsee}, section=${section}, numero=${numero}`,
      );
    }

    return {
      codeInsee,
      section,
      numero,
      iduComplet: identifiant,
    };
  }

  /**
   * Récupère une parcelle depuis l'API IGN
   *
   * IMPORTANT: Pour Paris, plusieurs parcelles peuvent avoir le même code_insee/section/numero
   * mais des IDU différents (car plusieurs arrondissements partagent le code_insee 75056).
   * On filtre donc les résultats pour trouver l'IDU exact.
   */
  private async fetchParcelle(components: {
    codeInsee: string;
    section: string;
    numero: string;
    iduComplet: string;
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

      // Si une seule parcelle, la retourner directement
      if (data.features.length === 1) {
        return {
          success: true,
          data: data.features[0],
          source: "IGN Cadastre",
        };
      }

      // Plusieurs résultats: filtrer par IDU exact (cas Paris)
      const normalizedIduSearch = normalizeParcelId(components.iduComplet);
      const matchingFeature = data.features.find((f) => {
        const iduReturned = f.properties.idu as string;
        const normalizedIduReturned = normalizeParcelId(iduReturned);
        return normalizedIduReturned === normalizedIduSearch;
      });

      if (!matchingFeature) {
        this.logger.warn(
          `Aucune parcelle avec IDU exact ${normalizedIduSearch} parmi ${data.features.length} résultats`,
        );
        return {
          success: false,
          error: "Parcelle non trouvée dans le cadastre",
          source: "IGN Cadastre",
        };
      }

      this.logger.debug(
        `Parcelle trouvée: ${matchingFeature.properties.idu} parmi ${data.features.length} résultats`,
      );

      return {
        success: true,
        data: matchingFeature,
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
   *
   * Même logique que fetchParcelle pour gérer les cas multiples (Paris)
   */
  private async fetchLocalisant(components: {
    codeInsee: string;
    section: string;
    numero: string;
    iduComplet: string;
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

      // Si une seule parcelle, la retourner directement
      if (data.features.length === 1) {
        return {
          success: true,
          data: data.features[0],
          source: "IGN Cadastre",
        };
      }

      // Plusieurs résultats: filtrer par IDU exact
      const normalizedIduSearch = normalizeParcelId(components.iduComplet);
      const matchingFeature = data.features.find((f) => {
        const iduReturned = f.properties.idu as string;
        const normalizedIduReturned = normalizeParcelId(iduReturned);
        return normalizedIduReturned === normalizedIduSearch;
      });

      if (!matchingFeature) {
        return {
          success: false,
          error: "Localisant non trouvé",
          source: "IGN Cadastre",
        };
      }

      return {
        success: true,
        data: matchingFeature,
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
      const coords = localisantResult.data.geometry.coordinates[0] as [number, number];
      const [longitude, latitude] = coords;
      return { latitude, longitude };
    }

    // Fallback: Calculer avec turf.js (plus précis)
    this.logger.warn("Localisant non disponible, calcul centroïde avec turf.js");
    return this.calculateCentroidWithTurf(
      parcelle.geometry as {
        type: "MultiPolygon" | "Polygon";
        coordinates: number[][][] | number[][][][];
      },
    );
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
      const coords = center.geometry.coordinates as [number, number];
      const [longitude, latitude] = coords;

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
