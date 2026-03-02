import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { GeometrieParcelle } from "@mutafriches/shared-types";
import { ZaerWfsResult, ZaerWfsFeatureCollection } from "./zaer-wfs.types";

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
  async findZaerIntersectingSite(geometrie: GeometrieParcelle): Promise<ZaerWfsResult[]> {
    const wkt = this.geometrieToWkt(geometrie);
    const cqlFilter = `INTERSECTS(geom,${wkt})`;
    return this.queryWfs(cqlFilter);
  }

  /**
   * Recherche les zones ZAER qui contiennent un point donné (fallback coordonnées)
   */
  async findZaerAtPoint(latitude: number, longitude: number): Promise<ZaerWfsResult[]> {
    // WFS EPSG:4326 attend (lat, lon) dans le WKT
    const cqlFilter = `INTERSECTS(geom,POINT(${latitude} ${longitude}))`;
    return this.queryWfs(cqlFilter);
  }

  /**
   * Exécute une requête WFS avec un filtre CQL et retourne les résultats normalisés
   */
  private async queryWfs(cqlFilter: string): Promise<ZaerWfsResult[]> {
    const startTime = Date.now();

    try {
      const params = {
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typename: "zaer:zaer",
        outputFormat: "application/json",
        propertyName: "nom,filiere,detail_filiere",
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
        const key = `${props.filiere}|${props.detail_filiere ?? ""}|${props.nom ?? ""}`;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            nom: props.nom ?? null,
            filiere: props.filiere,
            detailFiliere: props.detail_filiere ?? null,
          });
        }
      }

      return results;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      this.logger.error(
        `Erreur WFS ZAER (${responseTimeMs}ms) :`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
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
