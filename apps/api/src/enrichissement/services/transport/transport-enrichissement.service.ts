import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { ServicePublicService } from "../../adapters/service-public/service-public.service";
import { IgnWfsService } from "../../adapters/ign-wfs/ign-wfs.service";
import { OverpassService } from "../../adapters/overpass/overpass.service";
import { calculateDistance } from "../../adapters/shared/distance.utils";
import { TransportCalculator } from "./transport-enrichissement.calculator";
import {
  RAYON_RECHERCHE_AUTOROUTE_M,
  RAYON_RECHERCHE_TRANSPORT_M,
} from "./transport-enrichissement.constants";

/**
 * Service d'enrichissement du sous-domaine Transport
 *
 * Responsabilités :
 * - Determiner si la parcelle est en centre-ville (distance a la mairie)
 * - Calculer la distance a la voie de grande circulation la plus proche
 * - Recuperer la distance au transport en commun le plus proche (Overpass)
 */
@Injectable()
export class TransportEnrichissementService {
  private readonly logger = new Logger(TransportEnrichissementService.name);

  constructor(
    private readonly servicePublicService: ServicePublicService,
    private readonly ignWfsService: IgnWfsService,
    private readonly overpassService: OverpassService,
  ) {}

  async enrichir(parcelle: Parcelle): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // Verifications preliminaires
    if (!parcelle.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees disponibles pour la parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(
        SourceEnrichissement.SERVICE_PUBLIC,
        SourceEnrichissement.IGN_WFS,
        SourceEnrichissement.OVERPASS,
      );
      champsManquants.push("siteEnCentreVille", "distanceAutoroute", "distanceTransportCommun");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    if (!parcelle.codeInsee) {
      this.logger.warn(`Code INSEE manquant pour la parcelle ${parcelle.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
      // IGN WFS et Overpass peuvent quand meme fonctionner sans code INSEE
    }

    // Enrichissements
    await this.enrichirCentreVille(parcelle, sourcesUtilisees, sourcesEchouees, champsManquants);
    await this.enrichirDistanceAutoroute(
      parcelle,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );
    await this.enrichirTransportCommun(
      parcelle,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    };
  }

  /**
   * Determine si la parcelle est en centre-ville via l'API Service Public
   */
  private async enrichirCentreVille(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!parcelle.coordonnees || !parcelle.codeInsee) {
        throw new Error("Coordonnees ou code INSEE non disponibles");
      }

      this.logger.debug(
        `Parcelle ${parcelle.identifiantParcelle}: ` +
          `lat=${parcelle.coordonnees.latitude.toFixed(5)}, lon=${parcelle.coordonnees.longitude.toFixed(5)}`,
      );

      const mairieResult = await this.servicePublicService.getMairieCoordonnees(parcelle.codeInsee);

      if (!mairieResult.success || !mairieResult.data) {
        throw new Error(mairieResult.error || "Mairie non trouvee");
      }

      const coordonneesMairie = mairieResult.data.coordonnees;

      this.logger.debug(
        `Mairie ${mairieResult.data.nomCommune} (${parcelle.codeInsee}): ` +
          `lat=${coordonneesMairie.latitude.toFixed(5)}, lon=${coordonneesMairie.longitude.toFixed(5)}`,
      );

      const distanceMetres = calculateDistance(
        parcelle.coordonnees.latitude,
        parcelle.coordonnees.longitude,
        coordonneesMairie.latitude,
        coordonneesMairie.longitude,
      );

      this.logger.debug(`Distance calculee: ${Math.round(distanceMetres)}m`);

      parcelle.siteEnCentreVille = TransportCalculator.isCentreVille(distanceMetres);
      sourcesUtilisees.push(SourceEnrichissement.SERVICE_PUBLIC);

      this.logger.log(
        `Centre-ville: ${parcelle.siteEnCentreVille ? "OUI" : "NON"} ` +
          `(distance mairie: ${Math.round(distanceMetres)}m) ` +
          `pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la determination centre-ville:", error);
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
      parcelle.siteEnCentreVille = false;
    }
  }

  /**
   * Calcule la distance a la voie de grande circulation la plus proche via IGN WFS
   */
  private async enrichirDistanceAutoroute(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!parcelle.coordonnees) {
        throw new Error("Coordonnees non disponibles");
      }

      this.logger.debug(`Recherche voie grande circulation pour ${parcelle.identifiantParcelle}`);

      const wfsResult = await this.ignWfsService.getDistanceVoieGrandeCirculation(
        parcelle.coordonnees.latitude,
        parcelle.coordonnees.longitude,
        RAYON_RECHERCHE_AUTOROUTE_M,
      );

      if (!wfsResult.success || !wfsResult.data) {
        throw new Error(wfsResult.error || "Aucune voie trouvee");
      }

      const distanceMetres = wfsResult.data.distanceMetres;

      // Stocker la distance brute et la categorie
      parcelle.distanceAutoroute = Math.round(distanceMetres);

      sourcesUtilisees.push(SourceEnrichissement.IGN_WFS);

      this.logger.log(
        `Distance autoroute: ${Math.round(distanceMetres)}m ` +
          `(${TransportCalculator.categoriserDistanceAutoroute(distanceMetres)}) ` +
          `pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la recherche autoroute:", error);
      sourcesEchouees.push(SourceEnrichissement.IGN_WFS);
      champsManquants.push("distanceAutoroute");
      parcelle.distanceAutoroute = undefined;
    }
  }

  /**
   * Recupere la distance au transport en commun le plus proche via Overpass (OSM)
   *
   * Types de transports recherches :
   * - Gares ferroviaires (SNCF, TER, TGV)
   * - Stations de metro
   * - Arrets de tramway
   * - Arrets de bus et gares routieres
   */
  private async enrichirTransportCommun(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!parcelle.coordonnees) {
        throw new Error("Coordonnees non disponibles");
      }

      this.logger.debug(`Recherche transport en commun pour ${parcelle.identifiantParcelle}`);

      const overpassResult = await this.overpassService.getDistanceTransportCommun(
        parcelle.coordonnees.latitude,
        parcelle.coordonnees.longitude,
        RAYON_RECHERCHE_TRANSPORT_M,
      );

      if (!overpassResult.success || !overpassResult.data) {
        throw new Error(overpassResult.error || "Erreur Overpass");
      }

      const result = overpassResult.data;

      // -1 signifie aucun transport trouve dans le rayon
      if (result.distanceMetres === -1) {
        // On stocke la valeur max du rayon pour indiquer "au-dela du rayon"
        parcelle.distanceTransportCommun = RAYON_RECHERCHE_TRANSPORT_M;
        this.logger.debug(
          `Aucun transport dans un rayon de ${RAYON_RECHERCHE_TRANSPORT_M}m pour ${parcelle.identifiantParcelle}`,
        );
      } else {
        parcelle.distanceTransportCommun = result.distanceMetres;
      }

      sourcesUtilisees.push(SourceEnrichissement.OVERPASS);

      this.logger.log(
        `Distance transport: ${parcelle.distanceTransportCommun}m ` +
          `(${result.typeTransport}${result.nomArret ? ` - ${result.nomArret}` : ""}) ` +
          `pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation transport:", error);
      sourcesEchouees.push(SourceEnrichissement.OVERPASS);
      champsManquants.push("distanceTransportCommun");
      parcelle.distanceTransportCommun = undefined;
    }
  }
}
