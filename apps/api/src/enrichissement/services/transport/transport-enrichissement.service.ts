import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { ServicePublicService } from "../../adapters/service-public/service-public.service";
import { IgnWfsService } from "../../adapters/ign-wfs/ign-wfs.service";
import { calculateDistance } from "../../adapters/shared/distance.utils";
import { TransportCalculator } from "./transport-enrichissement.calculator";
import {
  RAYON_RECHERCHE_AUTOROUTE_M,
  RAYON_RECHERCHE_TRANSPORT_M,
} from "./transport-enrichissement.constants";
import { TransportStopsRepository } from "../../repositories/transport-stops.repository";

/**
 * Service d'enrichissement du sous-domaine Transport
 *
 * Responsabilites :
 * - Determiner si le site est en centre-ville (distance a la mairie)
 * - Calculer la distance a la voie de grande circulation la plus proche
 * - Calculer la distance au transport en commun le plus proche
 */
@Injectable()
export class TransportEnrichissementService {
  private readonly logger = new Logger(TransportEnrichissementService.name);

  constructor(
    private readonly servicePublicService: ServicePublicService,
    private readonly ignWfsService: IgnWfsService,
    private readonly transportStopsRepository: TransportStopsRepository,
  ) {}

  /**
   * Enrichit le site avec les informations de transport
   * @param site
   * @returns
   */
  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // Verifications preliminaires
    if (!site.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees disponibles pour le site ${site.identifiantParcelle}`,
      );
      sourcesEchouees.push(
        SourceEnrichissement.SERVICE_PUBLIC,
        SourceEnrichissement.IGN_WFS,
        SourceEnrichissement.TRANSPORT_DATA_GOUV,
      );
      champsManquants.push("siteEnCentreVille", "distanceAutoroute", "distanceTransportCommun");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    if (!site.codeInsee) {
      this.logger.warn(`Code INSEE manquant pour le site ${site.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
    }

    // Enrichissements
    await this.enrichirCentreVille(site, sourcesUtilisees, sourcesEchouees, champsManquants);
    await this.enrichirDistanceAutoroute(
      site,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );
    await this.enrichirTransportCommun(
      site,
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
   * Determine si le site est en centre-ville via l'API Service Public
   */
  private async enrichirCentreVille(
    site: Site,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!site.coordonnees || !site.codeInsee) {
        throw new Error("Coordonnees ou code INSEE non disponibles");
      }

      this.logger.debug(
        `Site ${site.identifiantParcelle}: ` +
          `lat=${site.coordonnees.latitude.toFixed(5)}, lon=${site.coordonnees.longitude.toFixed(5)}`,
      );

      const mairieResult = await this.servicePublicService.getMairieCoordonnees(site.codeInsee);

      if (!mairieResult.success || !mairieResult.data) {
        throw new Error(mairieResult.error || "Mairie non trouvee");
      }

      const coordonneesMairie = mairieResult.data.coordonnees;

      this.logger.debug(
        `Mairie ${mairieResult.data.nomCommune} (${site.codeInsee}): ` +
          `lat=${coordonneesMairie.latitude.toFixed(5)}, lon=${coordonneesMairie.longitude.toFixed(5)}`,
      );

      const distanceMetres = calculateDistance(
        site.coordonnees.latitude,
        site.coordonnees.longitude,
        coordonneesMairie.latitude,
        coordonneesMairie.longitude,
      );

      this.logger.debug(`Distance calculee: ${Math.round(distanceMetres)}m`);

      site.siteEnCentreVille = TransportCalculator.isCentreVille(distanceMetres);
      sourcesUtilisees.push(SourceEnrichissement.SERVICE_PUBLIC);

      this.logger.log(
        `Centre-ville: ${site.siteEnCentreVille ? "OUI" : "NON"} ` +
          `(distance mairie: ${Math.round(distanceMetres)}m) ` +
          `pour ${site.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la determination centre-ville:", error);
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
      site.siteEnCentreVille = false;
    }
  }

  /**
   * Calcule la distance a la voie de grande circulation la plus proche via IGN WFS
   */
  private async enrichirDistanceAutoroute(
    site: Site,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!site.coordonnees) {
        throw new Error("Coordonnees non disponibles");
      }

      this.logger.debug(`Recherche voie grande circulation pour ${site.identifiantParcelle}`);

      const wfsResult = await this.ignWfsService.getDistanceVoieGrandeCirculation(
        site.coordonnees.latitude,
        site.coordonnees.longitude,
        RAYON_RECHERCHE_AUTOROUTE_M,
      );

      if (!wfsResult.success || !wfsResult.data) {
        throw new Error(wfsResult.error || "Aucune voie trouvee");
      }

      const distanceMetres = wfsResult.data.distanceMetres;

      // Stocker la distance brute et la categorie
      site.distanceAutoroute = Math.round(distanceMetres);

      sourcesUtilisees.push(SourceEnrichissement.IGN_WFS);

      this.logger.log(
        `Distance autoroute: ${Math.round(distanceMetres)}m ` +
          `(${TransportCalculator.categoriserDistanceAutoroute(distanceMetres)}) ` +
          `pour ${site.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la recherche autoroute:", error);
      sourcesEchouees.push(SourceEnrichissement.IGN_WFS);
      champsManquants.push("distanceAutoroute");
      site.distanceAutoroute = undefined;
    }
  }

  /**
   * Calcule la distance au point d'arrêt de transport en commun le plus proche
   * Utilise les données de transport.data.gouv.fr
   */
  private async enrichirTransportCommun(
    site: Site,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!site.coordonnees) {
        throw new Error("Coordonnees non disponibles");
      }

      this.logger.debug(`Recherche transport en commun pour ${site.identifiantParcelle}`);

      // Recherche dans le rayon defini dans les constantes
      const distanceMetres = await this.transportStopsRepository.findTransportStopProximite(
        site.coordonnees.latitude,
        site.coordonnees.longitude,
        RAYON_RECHERCHE_TRANSPORT_M,
      );

      // Source utilisée même si aucun arrêt trouvé (la recherche a fonctionné)
      sourcesUtilisees.push(SourceEnrichissement.TRANSPORT_DATA_GOUV);

      if (distanceMetres === null) {
        // Aucun arrêt trouvé dans le rayon - c'est une information valide (pas un champ manquant)
        // null = "recherche OK, aucun résultat" vs undefined = "erreur technique"
        this.logger.log(
          `Aucun point d'arret trouve dans un rayon de ${RAYON_RECHERCHE_TRANSPORT_M}m ` +
            `pour ${site.identifiantParcelle}`,
        );
        site.distanceTransportCommun = null;
        return;
      }

      // Stocker la distance brute
      site.distanceTransportCommun = Math.round(distanceMetres);

      this.logger.log(
        `Distance transport: ${Math.round(distanceMetres)}m pour ${site.identifiantParcelle}`,
      );
    } catch (error) {
      // Erreur technique lors de la recherche
      this.logger.error("Erreur lors de la recherche transport en commun:", error);
      sourcesEchouees.push(SourceEnrichissement.TRANSPORT_DATA_GOUV);
      champsManquants.push("distanceTransportCommun");
      site.distanceTransportCommun = undefined;
    }
  }
}
