import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../shared/api-response.types";
import { calculateDistance } from "../shared/distance.utils";
import {
  OverpassRawResponse,
  OverpassElement,
  OverpassPoi,
  OverpassTransportResult,
  OverpassCommercesResult,
} from "./overpass.types";

/**
 * Types de transports en commun recherchés par Overpass
 *
 * Priorité de recherche (du plus important au moins important) :
 * 1. Gares ferroviaires (SNCF, TER, TGV)
 * 2. Stations de métro
 * 3. Stations de tramway
 * 4. Arrêts de bus
 *
 * Tags OSM utilisés :
 * - railway=station : Gare ferroviaire
 * - railway=halt : Halte ferroviaire (petite gare)
 * - station=subway : Station de métro
 * - railway=tram_stop : Arrêt de tramway
 * - highway=bus_stop : Arrêt de bus
 * - amenity=bus_station : Gare routière
 * - public_transport=stop_position : Position d'arrêt générique
 * - public_transport=platform : Quai/plateforme
 */
const TRANSPORT_TAGS = [
  // Gares ferroviaires (priorité haute)
  'node["railway"="station"]',
  'node["railway"="halt"]',
  // Métro
  'node["station"="subway"]',
  'node["railway"="subway_entrance"]',
  // Tramway
  'node["railway"="tram_stop"]',
  // Bus
  'node["highway"="bus_stop"]',
  'node["amenity"="bus_station"]',
  // Générique transport public
  'node["public_transport"="stop_position"]',
  'node["public_transport"="platform"]',
] as const;

/**
 * Types de commerces et services recherchés par Overpass
 *
 * Catégories essentielles pour l'analyse de mutabilité :
 * 1. Alimentation (supermarché, épicerie, boulangerie)
 * 2. Santé (pharmacie, médecin)
 * 3. Services publics (poste, banque)
 * 4. Commerces de proximité
 *
 * Tags OSM utilisés :
 * - shop=supermarket : Supermarché
 * - shop=convenience : Épicerie/supérette
 * - shop=bakery : Boulangerie
 * - shop=butcher : Boucherie
 * - amenity=pharmacy : Pharmacie
 * - amenity=doctors : Cabinet médical
 * - amenity=post_office : Bureau de poste
 * - amenity=bank : Banque
 */
const COMMERCES_SERVICES_TAGS = [
  // Alimentation
  'node["shop"="supermarket"]',
  'way["shop"="supermarket"]',
  'node["shop"="convenience"]',
  'node["shop"="bakery"]',
  'node["shop"="butcher"]',
  // Santé
  'node["amenity"="pharmacy"]',
  'node["amenity"="doctors"]',
  // Services publics
  'node["amenity"="post_office"]',
  'node["amenity"="bank"]',
  'way["amenity"="bank"]',
] as const;

/**
 * Configuration par défaut pour les requêtes Overpass
 */
const OVERPASS_CONFIG = {
  /** URL de l'API Overpass (instance principale) */
  BASE_URL: "https://overpass-api.de/api/interpreter",
  /** Timeout par défaut en secondes pour les requêtes */
  DEFAULT_TIMEOUT_SECONDS: 45,
  /** Timeout HTTP en millisecondes */
  HTTP_TIMEOUT_MS: 50000,
} as const;

@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Recherche le transport en commun le plus proche d'un point
   *
   * @param latitude - Latitude du point de recherche
   * @param longitude - Longitude du point de recherche
   * @param rayonMetres - Rayon de recherche en mètres
   * @returns Distance et informations sur le transport le plus proche
   */
  async getDistanceTransportCommun(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<ApiResponse<OverpassTransportResult>> {
    const startTime = Date.now();

    try {
      const query = this.buildTransportQuery(latitude, longitude, rayonMetres);
      const response = await this.executeQuery(query);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Aucune reponse de l'API Overpass",
          source: "API Overpass",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const elements = response.data.elements;

      if (elements.length === 0) {
        return {
          success: true,
          data: {
            distanceMetres: -1, // -1 indique aucun transport trouvé dans le rayon
            typeTransport: "AUCUN",
            nombreTransports: 0,
          },
          source: "API Overpass",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Calculer les distances et trouver le plus proche
      const transports = this.processElements(elements, latitude, longitude, "transport");
      transports.sort((a, b) => a.distanceMetres - b.distanceMetres);

      const plusProche = transports[0];

      return {
        success: true,
        data: {
          distanceMetres: Math.round(plusProche.distanceMetres),
          typeTransport: plusProche.category,
          nomArret: plusProche.name,
          nombreTransports: transports.length,
        },
        source: "API Overpass - OpenStreetMap",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(`Erreur Overpass transports: ${errorMessage}`);
      return {
        success: false,
        error: `Erreur technique Overpass: ${errorMessage}`,
        source: "API Overpass",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Vérifie la présence de commerces/services à proximité d'un point
   *
   * @param latitude - Latitude du point de recherche
   * @param longitude - Longitude du point de recherche
   * @param rayonMetres - Rayon de recherche en mètres
   * @returns Booléen de présence et statistiques
   */
  async hasCommercesServices(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<ApiResponse<OverpassCommercesResult>> {
    const startTime = Date.now();

    try {
      const query = this.buildCommercesQuery(latitude, longitude, rayonMetres);
      const response = await this.executeQuery(query);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Aucune reponse de l'API Overpass",
          source: "API Overpass",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const elements = response.data.elements;

      if (elements.length === 0) {
        return {
          success: true,
          data: {
            presenceCommercesServices: false,
            nombreCommercesServices: 0,
          },
          source: "API Overpass",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Calculer les distances et extraire les catégories
      const commerces = this.processElements(elements, latitude, longitude, "commerce");
      commerces.sort((a, b) => a.distanceMetres - b.distanceMetres);

      const categoriesUniques = [...new Set(commerces.map((c) => c.category))];

      return {
        success: true,
        data: {
          presenceCommercesServices: true,
          nombreCommercesServices: commerces.length,
          distancePlusProche: Math.round(commerces[0].distanceMetres),
          categoriesTrouvees: categoriesUniques,
        },
        source: "API Overpass - OpenStreetMap",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(`Erreur Overpass commerces: ${errorMessage}`);
      return {
        success: false,
        error: `Erreur technique Overpass: ${errorMessage}`,
        source: "API Overpass",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Construit la requête Overpass pour les transports en commun
   */
  private buildTransportQuery(latitude: number, longitude: number, rayonMetres: number): string {
    const timeout = OVERPASS_CONFIG.DEFAULT_TIMEOUT_SECONDS;
    const transportSelectors = TRANSPORT_TAGS.map(
      (tag) => `${tag}(around:${rayonMetres},${latitude},${longitude})`,
    ).join(";\n  ");

    return `
[out:json][timeout:${timeout}];
(
  ${transportSelectors};
);
out body;
`.trim();
  }

  /**
   * Construit la requête Overpass pour les commerces/services
   */
  private buildCommercesQuery(latitude: number, longitude: number, rayonMetres: number): string {
    const timeout = OVERPASS_CONFIG.DEFAULT_TIMEOUT_SECONDS;
    const commercesSelectors = COMMERCES_SERVICES_TAGS.map(
      (tag) => `${tag}(around:${rayonMetres},${latitude},${longitude})`,
    ).join(";\n  ");

    return `
[out:json][timeout:${timeout}];
(
  ${commercesSelectors};
);
out body center;
`.trim();
  }

  /**
   * Exécute une requête Overpass
   */
  private async executeQuery(query: string): Promise<ApiResponse<OverpassRawResponse>> {
    try {
      this.logger.debug(`Execution requete Overpass: ${query.substring(0, 100)}...`);

      const response = await firstValueFrom(
        this.httpService.post<OverpassRawResponse>(OVERPASS_CONFIG.BASE_URL, query, {
          headers: {
            "Content-Type": "text/plain",
            Accept: "application/json",
          },
          timeout: OVERPASS_CONFIG.HTTP_TIMEOUT_MS,
        }),
      );

      return {
        success: true,
        data: response.data,
        source: "API Overpass",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur Overpass";
      this.logger.error(`Erreur execution requete Overpass: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
        source: "API Overpass",
      };
    }
  }

  /**
   * Transforme les éléments Overpass en POI normalisés avec distance
   */
  private processElements(
    elements: OverpassElement[],
    refLatitude: number,
    refLongitude: number,
    type: "transport" | "commerce",
  ): OverpassPoi[] {
    return elements
      .map((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;

        if (!lat || !lon) {
          return null;
        }

        const distance = calculateDistance(refLatitude, refLongitude, lat, lon);
        const category = this.extractCategory(element, type);

        return {
          id: element.id,
          type: element.type,
          latitude: lat,
          longitude: lon,
          distanceMetres: distance,
          name: element.tags?.name,
          category,
          subcategory: element.tags?.shop || element.tags?.amenity || element.tags?.railway,
        } as OverpassPoi;
      })
      .filter((poi): poi is OverpassPoi => poi !== null);
  }

  /**
   * Extrait la catégorie d'un élément OSM
   */
  private extractCategory(element: OverpassElement, type: "transport" | "commerce"): string {
    const tags = element.tags || {};

    if (type === "transport") {
      if (tags.railway === "station") return "GARE_FERROVIAIRE";
      if (tags.railway === "halt") return "HALTE_FERROVIAIRE";
      if (tags.station === "subway" || tags.railway === "subway_entrance") return "METRO";
      if (tags.railway === "tram_stop") return "TRAMWAY";
      if (tags.highway === "bus_stop") return "ARRET_BUS";
      if (tags.amenity === "bus_station") return "GARE_ROUTIERE";
      if (tags.public_transport) return "TRANSPORT_PUBLIC";
      return "AUTRE_TRANSPORT";
    }

    if (type === "commerce") {
      if (tags.shop === "supermarket") return "SUPERMARCHE";
      if (tags.shop === "convenience") return "EPICERIE";
      if (tags.shop === "bakery") return "BOULANGERIE";
      if (tags.shop === "butcher") return "BOUCHERIE";
      if (tags.amenity === "pharmacy") return "PHARMACIE";
      if (tags.amenity === "doctors") return "MEDECIN";
      if (tags.amenity === "post_office") return "POSTE";
      if (tags.amenity === "bank") return "BANQUE";
      return "AUTRE_COMMERCE";
    }

    return "INCONNU";
  }
}
