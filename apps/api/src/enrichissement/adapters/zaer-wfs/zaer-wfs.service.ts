import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { GeometrieParcelle, SourceEnrichissement } from "@mutafriches/shared-types";
import { ApiResponse } from "../shared/api-response.types";
import { ZaerWfsResult, ZaerWfsFeatureCollection, ZaerWfsProperties } from "./zaer-wfs.types";

/**
 * Adapter WFS pour les Zones d'Accélération des Énergies Renouvelables (ZAER)
 *
 * Interroge le WFS Géoplateforme à la volée via CQL_FILTER=INTERSECTS
 * pour déterminer si un site est situé dans une ou plusieurs zones ZAER.
 *
 * Note importante : le WFS 2.0.0 en EPSG:4326 attend les coordonnées
 * en ordre (latitude, longitude) dans les filtres CQL, alors que le GeoJSON
 * utilise (longitude, latitude).
 *
 * Source : https://data.geopf.fr/wfs — typename zaer:zaer
 */
@Injectable()
export class ZaerWfsService {
  private readonly logger = new Logger(ZaerWfsService.name);
  private readonly baseUrl = "https://data.geopf.fr/wfs";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Recherche les zones ZAER qui intersectent une géométrie (polygone/multipolygone)
   */
  async findZaerIntersectingSite(
    geometrie: GeometrieParcelle,
  ): Promise<ApiResponse<ZaerWfsResult[]>> {
    const wkt = this.geometrieToWkt(geometrie);
    const cqlFilter = `INTERSECTS(geom,${wkt})`;
    return this.queryWfs(cqlFilter);
  }

  /**
   * Recherche les zones ZAER qui contiennent un point donné (fallback coordonnées)
   */
  async findZaerAtPoint(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<ZaerWfsResult[]>> {
    // WFS EPSG:4326 attend (lat, lon) dans le WKT
    const cqlFilter = `INTERSECTS(geom,POINT(${latitude} ${longitude}))`;
    return this.queryWfs(cqlFilter);
  }

  /**
   * Exécute une requête WFS avec un filtre CQL et retourne les résultats normalisés
   */
  private async queryWfs(cqlFilter: string): Promise<ApiResponse<ZaerWfsResult[]>> {
    const startTime = Date.now();

    try {
      const params = {
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typename: "zaer:zaer",
        outputFormat: "application/json",
        // detail_filiere a été scindé en 3 niveaux hiérarchiques côté WFS
        propertyName: "nom,filiere,detail_filiere1,detail_filiere2,detail_filiere3",
        CQL_FILTER: cqlFilter,
        count: "100",
      };

      this.logger.debug(`Requête WFS ZAER : CQL_FILTER=${cqlFilter}`);

      const response = await firstValueFrom(
        this.httpService.get<ZaerWfsFeatureCollection>(this.baseUrl, {
          params,
          timeout: 15_000,
        }),
      );

      const features = response.data.features ?? [];
      const responseTimeMs = Date.now() - startTime;

      this.logger.debug(`WFS ZAER : ${features.length} zone(s) en ${responseTimeMs}ms`);

      // Dédupliquer par (filière, détail, nom)
      const seen = new Set<string>();
      const results: ZaerWfsResult[] = [];

      for (const feature of features) {
        const props = feature.properties;
        const detailFiliere = this.coalesceDetailFiliere(props);
        const key = `${props.filiere}|${detailFiliere ?? ""}|${props.nom ?? ""}`;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            nom: props.nom ?? null,
            filiere: props.filiere,
            detailFiliere,
          });
        }
      }

      return {
        success: true,
        data: results,
        source: SourceEnrichissement.ZAER,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur WFS ZAER (${responseTimeMs}ms) : ${message}`);
      return {
        success: false,
        error: message,
        source: SourceEnrichissement.ZAER,
        responseTimeMs,
      };
    }
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
