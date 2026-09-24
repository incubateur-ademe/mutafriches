import { Injectable, Logger } from "@nestjs/common";
import { IgnWfsService } from "../../adapters/ign-wfs/ign-wfs.service";
import { IgnItineraireService } from "../../adapters/ign-itineraire/ign-itineraire.service";
import { PointWgs84 } from "../../adapters/ign-itineraire/ign-itineraire.types";
import { AccesAutoroutierCalculator } from "./acces-autoroutier.calculator";
import {
  MAX_ITINERAIRES_ACCES_AUTOROUTIER,
  RAYONS_RECHERCHE_ACCES_AUTOROUTIER_M,
} from "./transport-enrichissement.constants";

export type ResultatAccesAutoroutier =
  // parLaRoute = false : itinéraire indisponible, repli sur la distance à vol d'oiseau
  | { statut: "trouve"; distanceMetres: number; parLaRoute: boolean }
  | { statut: "aucun" }
  | { statut: "erreur"; message: string };

/**
 * Distance par la route jusqu'à l'entrée d'autoroute ou de voie express la plus proche (ADR-0047).
 */
@Injectable()
export class AccesAutoroutierService {
  private readonly logger = new Logger(AccesAutoroutierService.name);

  constructor(
    private readonly ignWfsService: IgnWfsService,
    private readonly ignItineraireService: IgnItineraireService,
  ) {}

  async calculerDistance(site: PointWgs84): Promise<ResultatAccesAutoroutier> {
    const dejaCalculees = new Set<string>();
    let meilleureRoute: number | null = null;
    let plusProcheVolOiseau: number | null = null;
    let appels = 0;

    for (const rayon of RAYONS_RECHERCHE_ACCES_AUTOROUTIER_M) {
      const wfs = await this.ignWfsService.getTronconsAutoroutiers(
        site.latitude,
        site.longitude,
        rayon,
      );
      if (!wfs.success || !wfs.data) {
        return { statut: "erreur", message: wfs.error ?? "Réponse WFS vide" };
      }

      const entrees = AccesAutoroutierCalculator.extraireEntrees(wfs.data, site, rayon);
      if (entrees.length === 0) continue;
      plusProcheVolOiseau = Math.min(
        plusProcheVolOiseau ?? Infinity,
        entrees[0].distanceVolOiseauMetres,
      );

      for (const entree of entrees) {
        if (appels >= MAX_ITINERAIRES_ACCES_AUTOROUTIER) break;
        // La route ne peut pas être plus courte que le vol d'oiseau : entrées suivantes inutiles
        if (meilleureRoute !== null && entree.distanceVolOiseauMetres >= meilleureRoute) break;

        const cle = `${entree.longitude},${entree.latitude}`;
        if (dejaCalculees.has(cle)) continue;
        dejaCalculees.add(cle);

        appels++;
        const itineraire = await this.ignItineraireService.getDistanceRoutiere(site, entree);
        if (itineraire.success && itineraire.data) {
          meilleureRoute = Math.min(meilleureRoute ?? Infinity, itineraire.data.distanceMetres);
        }
      }

      // Une route plus longue que le rayon peut être battue par une entrée plus lointaine
      if (meilleureRoute !== null && meilleureRoute <= rayon) break;
      if (appels >= MAX_ITINERAIRES_ACCES_AUTOROUTIER) break;
    }

    if (meilleureRoute !== null) {
      return { statut: "trouve", distanceMetres: meilleureRoute, parLaRoute: true };
    }
    if (plusProcheVolOiseau !== null) {
      this.logger.warn("Itinéraire IGN indisponible : repli sur la distance à vol d'oiseau");
      return { statut: "trouve", distanceMetres: plusProcheVolOiseau, parLaRoute: false };
    }
    return { statut: "aucun" };
  }
}
