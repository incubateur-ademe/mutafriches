import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { GeometrieParcelle, SourceEnrichissement } from "@mutafriches/shared-types";
import { ApiResponse } from "../shared/api-response.types";
import {
  ZaerWfsResult,
  ZaerExclusionResult,
  ZaerWfsProperties,
  ZaerExclusionWfsProperties,
  WfsFeature,
  WfsFeatureCollection,
} from "./zaer-wfs.types";

const TYPENAME_ACCELERATION = "zaer:zaer";
// detail_filiere a été scindé en 3 niveaux hiérarchiques côté WFS
const PROPRIETES_ACCELERATION = "nom,filiere,detail_filiere1,detail_filiere2,detail_filiere3";

// Couche OFB des interdictions APER : elle mélange deux régimes, discriminés par `zonage`
// (« toutes ENR sauf toiture » et « éolien uniquement »). L'alias
// OFB_ZONES.EXCLUES.SAUF.TOITURE pointe la même donnée mais son DescribeFeatureType est cassé.
const TYPENAME_EXCLUSION =
  "OFB_INTERDICTION-ZAER-SAUF-TOITURE:zones_exclues_aires_acceleration_sauf_toiture";
const PROPRIETES_EXCLUSION = "code,nom_zone,type_zone,zonage";

/**
 * Adapter WFS pour les zonages liés à la loi APER
 *
 * Interroge le WFS Géoplateforme à la volée via CQL_FILTER=INTERSECTS, sur deux
 * couches distinctes : les zones d'accélération et les zones d'interdiction.
 *
 * Note importante : le WFS 2.0.0 en EPSG:4326 attend les coordonnées
 * en ordre (latitude, longitude) dans les filtres CQL, alors que le GeoJSON
 * utilise (longitude, latitude). Vérifié sur les deux couches.
 *
 * Source : https://data.geopf.fr/wfs
 */
@Injectable()
export class ZaerWfsService {
  private readonly logger = new Logger(ZaerWfsService.name);
  private readonly baseUrl = "https://data.geopf.fr/wfs";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Recherche les zones d'accélération qui intersectent une géométrie
   */
  async findZaerIntersectingSite(
    geometrie: GeometrieParcelle,
  ): Promise<ApiResponse<ZaerWfsResult[]>> {
    return this.queryAcceleration(this.filtreGeometrie(geometrie));
  }

  /**
   * Recherche les zones d'accélération qui contiennent un point donné (fallback coordonnées)
   */
  async findZaerAtPoint(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<ZaerWfsResult[]>> {
    return this.queryAcceleration(this.filtrePoint(latitude, longitude));
  }

  /**
   * Recherche les zones d'interdiction APER qui intersectent une géométrie
   */
  async findExclusionIntersectingSite(
    geometrie: GeometrieParcelle,
  ): Promise<ApiResponse<ZaerExclusionResult[]>> {
    return this.queryExclusion(this.filtreGeometrie(geometrie));
  }

  /**
   * Recherche les zones d'interdiction APER qui contiennent un point donné
   */
  async findExclusionAtPoint(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<ZaerExclusionResult[]>> {
    return this.queryExclusion(this.filtrePoint(latitude, longitude));
  }

  private async queryAcceleration(cqlFilter: string): Promise<ApiResponse<ZaerWfsResult[]>> {
    const startTime = Date.now();

    try {
      const features = await this.getFeatures<ZaerWfsProperties>(
        TYPENAME_ACCELERATION,
        PROPRIETES_ACCELERATION,
        cqlFilter,
      );

      const seen = new Set<string>();
      const results: ZaerWfsResult[] = [];

      for (const { properties: props } of features) {
        const detailFiliere = this.coalesceDetailFiliere(props);
        const key = `${props.filiere}|${detailFiliere ?? ""}|${props.nom ?? ""}`;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({ nom: props.nom ?? null, filiere: props.filiere, detailFiliere });
        }
      }

      return this.succes(results, features.length, "accélération", startTime);
    } catch (error) {
      return this.enErreur(error, "accélération", startTime);
    }
  }

  private async queryExclusion(cqlFilter: string): Promise<ApiResponse<ZaerExclusionResult[]>> {
    const startTime = Date.now();

    try {
      const features = await this.getFeatures<ZaerExclusionWfsProperties>(
        TYPENAME_EXCLUSION,
        PROPRIETES_EXCLUSION,
        cqlFilter,
      );

      const seen = new Set<string>();
      const results: ZaerExclusionResult[] = [];

      for (const { properties: props } of features) {
        const key = `${props.code ?? ""}|${props.nom_zone ?? ""}|${props.zonage ?? ""}`;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            code: props.code ?? null,
            nomZone: props.nom_zone ?? null,
            typeZone: props.type_zone ?? null,
            zonage: props.zonage?.trim() || null,
          });
        }
      }

      return this.succes(results, features.length, "interdiction", startTime);
    } catch (error) {
      return this.enErreur(error, "interdiction", startTime);
    }
  }

  /**
   * Interroge le WFS et retourne les features brutes
   */
  private async getFeatures<P>(
    typename: string,
    propertyName: string,
    cqlFilter: string,
  ): Promise<WfsFeature<P>[]> {
    const params = {
      service: "WFS",
      version: "2.0.0",
      request: "GetFeature",
      typename,
      outputFormat: "application/json",
      propertyName,
      CQL_FILTER: cqlFilter,
      count: "100",
    };

    this.logger.debug(`Requête WFS ${typename} : CQL_FILTER=${cqlFilter}`);

    const response = await firstValueFrom(
      this.httpService.get<WfsFeatureCollection<P>>(this.baseUrl, {
        params,
        timeout: 15_000,
      }),
    );

    return response.data.features ?? [];
  }

  private succes<T>(
    data: T[],
    nombreFeatures: number,
    couche: string,
    startTime: number,
  ): ApiResponse<T[]> {
    const responseTimeMs = Date.now() - startTime;
    this.logger.debug(`WFS ZAER (${couche}) : ${nombreFeatures} zone(s) en ${responseTimeMs}ms`);

    return {
      success: true,
      data,
      source: SourceEnrichissement.ZAER,
      responseTimeMs,
    };
  }

  private enErreur<T>(error: unknown, couche: string, startTime: number): ApiResponse<T[]> {
    const responseTimeMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Erreur WFS ZAER (${couche}, ${responseTimeMs}ms) : ${message}`);
    return {
      success: false,
      error: message,
      source: SourceEnrichissement.ZAER,
      responseTimeMs,
    };
  }

  /**
   * Coalesce les 3 niveaux de detail_filiere en une seule valeur.
   * Joint les niveaux non vides (du plus général au plus précis) afin de
   * préserver la détection d'un mot-clé (ex. "OMBRIERE") à n'importe quel niveau.
   */
  private coalesceDetailFiliere(props: ZaerWfsProperties): string | null {
    const niveaux = [props.detail_filiere1, props.detail_filiere2, props.detail_filiere3]
      .map((n) => n?.trim())
      .filter((n): n is string => !!n);

    return niveaux.length > 0 ? niveaux.join(" / ") : null;
  }

  private filtreGeometrie(geometrie: GeometrieParcelle): string {
    return `INTERSECTS(geom,${this.geometrieToWkt(geometrie)})`;
  }

  private filtrePoint(latitude: number, longitude: number): string {
    // WFS EPSG:4326 attend (lat, lon) dans le WKT
    return `INTERSECTS(geom,POINT(${latitude} ${longitude}))`;
  }

  /**
   * Convertit une GeometrieParcelle GeoJSON en WKT avec axes inversés (lat, lon)
   * pour le WFS EPSG:4326
   */
  private geometrieToWkt(geometrie: GeometrieParcelle): string {
    if (geometrie.type === "Polygon") {
      const coords = geometrie.coordinates as number[][][];
      const rings = coords.map((ring) => this.ringToWkt(ring)).join(",");
      return `POLYGON(${rings})`;
    }

    // MultiPolygon
    const coords = geometrie.coordinates as number[][][][];
    const polygons = coords
      .map((polygon) => {
        const rings = polygon.map((ring) => this.ringToWkt(ring)).join(",");
        return `(${rings})`;
      })
      .join(",");
    return `MULTIPOLYGON(${polygons})`;
  }

  /**
   * Convertit un anneau de coordonnées GeoJSON [lon, lat] en WKT (lat lon)
   */
  private ringToWkt(ring: number[][]): string {
    const points = ring.map(([lon, lat]) => `${lat} ${lon}`).join(",");
    return `(${points})`;
  }
}
