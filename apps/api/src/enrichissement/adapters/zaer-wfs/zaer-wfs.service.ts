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
const PROPRIETES_ACCELERATION = [
  "nom",
  "filiere",
  "detail_filiere1",
  "detail_filiere2",
  "detail_filiere3",
];

// Couche OFB des interdictions APER : elle mélange deux régimes, discriminés par `zonage`
// (« toutes ENR sauf toiture » et « éolien uniquement »). L'alias
// OFB_ZONES.EXCLUES.SAUF.TOITURE pointe la même donnée mais son DescribeFeatureType est cassé.
const TYPENAME_EXCLUSION =
  "OFB_INTERDICTION-ZAER-SAUF-TOITURE:zones_exclues_aires_acceleration_sauf_toiture";
const PROPRIETES_EXCLUSION = ["code", "nom_zone", "type_zone", "zonage"];

const SRS_URN = "urn:ogc:def:crs:EPSG::4326";

/**
 * Géométrie GML produite à la demande : la construction valide les coordonnées et peut donc
 * lever, ce qui doit rester à l'intérieur du try/catch de la requête (un adapter ne throw pas).
 */
type ConstructeurGml = () => string;
const LIMITE_FEATURES = 100;
const TIMEOUT_MS = 15_000;

/**
 * Adapter WFS pour les zonages liés à la loi APER
 *
 * Interroge le WFS Géoplateforme à la volée par un GetFeature POST (XML natif WFS 2.0,
 * filtre fes:Intersects sur une géométrie GML), sur deux couches distinctes : les zones
 * d'accélération et les zones d'interdiction.
 *
 * POST et non GET : le WKT d'une parcelle un peu découpée dépasse la limite d'URL du
 * serveur (8 192 octets), qui répond alors 414 sur les deux couches (ADR-0038).
 *
 * Note importante : le WFS 2.0.0 en EPSG:4326 attend les coordonnées
 * en ordre (latitude, longitude) dans les filtres, alors que le GeoJSON
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
    return this.queryAcceleration(() => this.gmlSurfaces(geometrie));
  }

  /**
   * Recherche les zones d'accélération qui contiennent un point donné (fallback coordonnées)
   */
  async findZaerAtPoint(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<ZaerWfsResult[]>> {
    return this.queryAcceleration(() => this.gmlPoint(latitude, longitude));
  }

  /**
   * Recherche les zones d'interdiction APER qui intersectent une géométrie
   */
  async findExclusionIntersectingSite(
    geometrie: GeometrieParcelle,
  ): Promise<ApiResponse<ZaerExclusionResult[]>> {
    return this.queryExclusion(() => this.gmlSurfaces(geometrie));
  }

  /**
   * Recherche les zones d'interdiction APER qui contiennent un point donné
   */
  async findExclusionAtPoint(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<ZaerExclusionResult[]>> {
    return this.queryExclusion(() => this.gmlPoint(latitude, longitude));
  }

  private async queryAcceleration(gml: ConstructeurGml): Promise<ApiResponse<ZaerWfsResult[]>> {
    const startTime = Date.now();

    try {
      const features = await this.getFeatures<ZaerWfsProperties>(
        TYPENAME_ACCELERATION,
        PROPRIETES_ACCELERATION,
        gml(),
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

  private async queryExclusion(gml: ConstructeurGml): Promise<ApiResponse<ZaerExclusionResult[]>> {
    const startTime = Date.now();

    try {
      const features = await this.getFeatures<ZaerExclusionWfsProperties>(
        TYPENAME_EXCLUSION,
        PROPRIETES_EXCLUSION,
        gml(),
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
    proprietes: string[],
    gmlGeometrie: string,
  ): Promise<WfsFeature<P>[]> {
    const requete = this.requeteGetFeature(typename, proprietes, gmlGeometrie);

    this.logger.debug(`Requête WFS ${typename} : ${requete.length} octets de XML`);

    const response = await firstValueFrom(
      this.httpService.post<WfsFeatureCollection<P>>(this.baseUrl, requete, {
        headers: { "Content-Type": "application/xml" },
        timeout: TIMEOUT_MS,
      }),
    );

    return response.data.features ?? [];
  }

  /** Enveloppe GetFeature XML (WFS 2.0) avec filtre spatial sur la colonne `geom` */
  private requeteGetFeature(typename: string, proprietes: string[], gmlGeometrie: string): string {
    const propertyNames = proprietes
      .map((p) => `<wfs:PropertyName>${p}</wfs:PropertyName>`)
      .join("");

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<wfs:GetFeature service="WFS" version="2.0.0" outputFormat="application/json"` +
      ` count="${LIMITE_FEATURES}"` +
      ` xmlns:wfs="http://www.opengis.net/wfs/2.0"` +
      ` xmlns:fes="http://www.opengis.net/fes/2.0"` +
      ` xmlns:gml="http://www.opengis.net/gml/3.2">` +
      `<wfs:Query typeNames="${typename}">${propertyNames}` +
      `<fes:Filter><fes:Intersects><fes:ValueReference>geom</fes:ValueReference>` +
      gmlGeometrie +
      `</fes:Intersects></fes:Filter></wfs:Query></wfs:GetFeature>`
    );
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

  /** Point GML, axes inversés (lat, lon) pour le WFS EPSG:4326 */
  private gmlPoint(latitude: number, longitude: number): string {
    return (
      `<gml:Point srsName="${SRS_URN}">` +
      `<gml:pos>${this.coordonnee(latitude)} ${this.coordonnee(longitude)}</gml:pos>` +
      `</gml:Point>`
    );
  }

  /**
   * Convertit une GeometrieParcelle GeoJSON en gml:MultiSurface, axes inversés (lat, lon).
   * Un Polygon simple passe par un MultiSurface à un membre : une seule forme à produire.
   */
  private gmlSurfaces(geometrie: GeometrieParcelle): string {
    const polygones =
      geometrie.type === "Polygon"
        ? [geometrie.coordinates as number[][][]]
        : (geometrie.coordinates as number[][][][]);

    const membres = polygones
      .map((polygone) => `<gml:surfaceMember>${this.gmlPolygon(polygone)}</gml:surfaceMember>`)
      .join("");

    return `<gml:MultiSurface srsName="${SRS_URN}">${membres}</gml:MultiSurface>`;
  }

  /** Premier anneau = contour extérieur, les suivants = trous */
  private gmlPolygon(polygone: number[][][]): string {
    const [exterieur, ...trous] = polygone;

    const interieurs = trous
      .map((trou) => `<gml:interior>${this.gmlLinearRing(trou)}</gml:interior>`)
      .join("");

    return (
      `<gml:Polygon><gml:exterior>${this.gmlLinearRing(exterieur)}</gml:exterior>` +
      `${interieurs}</gml:Polygon>`
    );
  }

  private gmlLinearRing(ring: number[][]): string {
    const posList = ring
      .map(([lon, lat]) => `${this.coordonnee(lat)} ${this.coordonnee(lon)}`)
      .join(" ");

    return `<gml:LinearRing><gml:posList>${posList}</gml:posList></gml:LinearRing>`;
  }

  /**
   * Seules valeurs non constantes injectées dans le XML : on refuse tout ce qui n'est pas
   * un nombre fini plutôt que de laisser passer une chaîne dans le document.
   */
  private coordonnee(valeur: number): string {
    if (!Number.isFinite(valeur)) {
      throw new Error(`Coordonnée invalide dans la géométrie du site : ${String(valeur)}`);
    }

    return String(valeur);
  }
}
