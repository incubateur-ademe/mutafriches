import { Injectable, Logger } from "@nestjs/common";
import { centroid } from "@turf/centroid";
import { union } from "@turf/union";
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Geometry } from "geojson";
import { Coordonnees, GeometrieParcelle } from "@mutafriches/shared-types";
import { Site, ParcelleData } from "../../entities/site.entity";

/**
 * Service de calcul géométrique pour les sites multi-parcellaires
 *
 * Responsabilités :
 * - Calculer l'union des géométries de parcelles via Turf.js
 * - Calculer le centroïde du site à partir de la géométrie union
 * - Assembler un objet Site complet
 */
@Injectable()
export class SiteGeometryService {
  private readonly logger = new Logger(SiteGeometryService.name);

  /**
   * Construit un Site complet à partir des données de parcelles
   * Calcule l'union des géométries et le centroïde
   */
  construireSite(parcelles: ParcelleData[]): Site {
    const site = new Site();
    site.parcelles = parcelles;

    // Calculer la géométrie union si des géométries sont disponibles
    const parcellesAvecGeometrie = parcelles.filter((p) => p.geometrie !== undefined);

    if (parcellesAvecGeometrie.length > 0) {
      site.geometrieUnion = this.calculerUnionGeometries(parcellesAvecGeometrie);

      if (site.geometrieUnion) {
        site.centroidSite = this.calculerCentroid(site.geometrieUnion);
      }
    }

    // Fallback : si pas de géométrie union, utiliser le centroïde de la parcelle prédominante
    if (!site.centroidSite) {
      const predominante = site.parcellePredominante;
      if (predominante.coordonnees) {
        site.centroidSite = predominante.coordonnees;
        this.logger.warn("Centroïde calculé depuis la parcelle prédominante (fallback)");
      }
    }

    this.logger.log(
      `Site construit : ${site.nombreParcelles} parcelle(s), ` +
        `surface totale ${site.surfaceTotale}m², ` +
        `commune prédominante ${site.communePredominante.commune}`,
    );

    return site;
  }

  /**
   * Calcule l'union de toutes les géométries de parcelles via Turf.js
   */
  private calculerUnionGeometries(parcelles: ParcelleData[]): GeometrieParcelle | undefined {
    try {
      const features = parcelles
        .filter((p) => p.geometrie !== undefined)
        .map((p) => this.toTurfFeature(p.geometrie as GeometrieParcelle));

      if (features.length === 0) return undefined;

      if (features.length === 1) {
        return parcelles[0].geometrie;
      }

      // Union via FeatureCollection (API Turf.js v7)
      const featureCollection: FeatureCollection<Polygon | MultiPolygon> = {
        type: "FeatureCollection",
        features,
      };

      const result = union(featureCollection);

      if (!result) {
        this.logger.warn("Union des géométries a retourné null");
        return parcelles[0].geometrie;
      }

      return {
        type: result.geometry.type as "Polygon" | "MultiPolygon",
        coordinates: result.geometry.coordinates,
      } as GeometrieParcelle;
    } catch (error) {
      this.logger.error("Erreur lors du calcul de l'union des géométries:", error);
      // Fallback : retourner la géométrie de la première parcelle
      return parcelles[0].geometrie;
    }
  }

  /**
   * Calcule le centroïde d'une géométrie via Turf.js
   */
  private calculerCentroid(geometrie: GeometrieParcelle): Coordonnees | undefined {
    try {
      const feature = {
        type: "Feature" as const,
        geometry: geometrie as unknown as Geometry,
        properties: {},
      };

      const center = centroid(feature);
      const coords = center.geometry.coordinates as [number, number];
      const [longitude, latitude] = coords;

      return { latitude, longitude };
    } catch (error) {
      this.logger.error("Erreur lors du calcul du centroïde:", error);
      return undefined;
    }
  }

  /**
   * Convertit une GeometrieParcelle en Feature Turf.js
   */
  private toTurfFeature(geometrie: GeometrieParcelle): Feature<Polygon | MultiPolygon> {
    return {
      type: "Feature",
      geometry: geometrie as unknown as Polygon | MultiPolygon,
      properties: {},
    };
  }
}
