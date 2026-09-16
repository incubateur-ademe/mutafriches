import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { ReseauxChaleurRepository } from "../../repositories/reseaux-chaleur.repository";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Service d'enrichissement de la distance au réseau de chaleur urbain
 *
 * Source : référentiel local `raw_reseaux_chaleur`, importé depuis France Chaleur Urbaine
 * (`pnpm db:reseaux-chaleur:import`). La distance est calculée en PostGIS sur le tracé publié
 * plutôt que via l'endpoint `/v1/eligibility`, qui la mesure sur une géométrie partielle pour
 * une partie des réseaux (cf. ADR-0037).
 *
 * Sémantique du champ `distanceReseauChaleur` :
 *   - nombre   : distance en mètres au réseau le plus proche
 *   - null     : recherche effectuée, aucun réseau dans le rayon — compte comme renseigné
 *   - undefined: la recherche a échoué, la donnée est indisponible
 */
@Injectable()
export class ReseauChaleurEnrichissementService {
  private readonly logger = new Logger(ReseauChaleurEnrichissementService.name);

  constructor(private readonly reseauxChaleurRepository: ReseauxChaleurRepository) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(`Pas de coordonnées disponibles pour le site ${site.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
      champsManquants.push("distanceReseauChaleur");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    try {
      const reseau = await this.reseauxChaleurRepository.findReseauProche(
        site.coordonnees.latitude,
        site.coordonnees.longitude,
      );

      // Aucun réseau dans le rayon est un résultat de recherche, pas un échec : le marquer
      // en source échouée invaliderait le cache strict de tous les sites hors réseau.
      site.distanceReseauChaleur = reseau === null ? null : Math.round(reseau.distance);
      sourcesUtilisees.push(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);

      if (reseau === null) {
        this.logger.log(`Aucun réseau de chaleur dans le rayon pour ${site.identifiantParcelle}`);
      } else {
        this.logger.log(
          `Réseau de chaleur "${reseau.nom ?? "sans nom"}" à ${Math.round(reseau.distance)}m ` +
            `pour ${site.identifiantParcelle}` +
            (reseau.traceComplet ? "" : " (tracé non publié, distance majorée)"),
        );
      }
    } catch (error) {
      this.logger.error("Erreur lors de la recherche du réseau de chaleur :", error);
      sourcesEchouees.push(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
      champsManquants.push("distanceReseauChaleur");
      site.distanceReseauChaleur = undefined;
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
