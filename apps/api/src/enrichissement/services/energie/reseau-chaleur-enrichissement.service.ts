import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { FranceChaleurUrbaineService } from "../../adapters/france-chaleur-urbaine/france-chaleur-urbaine.service";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Service d'enrichissement de la distance au réseau de chaleur urbain
 *
 * Source : API France Chaleur Urbaine (ministère de la Transition écologique)
 *
 * Sémantique du champ `distanceReseauChaleur` :
 *   - nombre   : distance en mètres au réseau le plus proche
 *   - null     : recherche effectuée, aucune distance exploitable (aucun réseau à proximité,
 *                ou réseau connu dont FCU n'a pas le tracé) — compte comme renseigné
 *   - undefined: l'appel a échoué, la donnée est indisponible
 */
@Injectable()
export class ReseauChaleurEnrichissementService {
  private readonly logger = new Logger(ReseauChaleurEnrichissementService.name);

  constructor(private readonly franceChaleurUrbaineService: FranceChaleurUrbaineService) {}

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

    const resultat = await this.franceChaleurUrbaineService.getEligibilite(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    if (!resultat.success || !resultat.data) {
      this.logger.warn(
        `Échec récupération France Chaleur Urbaine : ${resultat.error ?? "Aucune donnée"}`,
      );
      sourcesEchouees.push(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
      champsManquants.push("distanceReseauChaleur");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // Une absence de distance est un résultat de recherche, pas un échec : la marquer en
    // source échouée invaliderait le cache strict de tous les sites hors réseau de chaleur.
    const distance = resultat.data.distance;
    site.distanceReseauChaleur = distance === null ? null : Math.round(distance);
    sourcesUtilisees.push(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);

    if (distance === null) {
      this.logger.log(
        `Aucune distance à un réseau de chaleur pour ${site.identifiantParcelle}` +
          (resultat.data.name ? ` (réseau "${resultat.data.name}" connu, tracé indisponible)` : ""),
      );
    } else {
      this.logger.log(
        `Réseau de chaleur à ${Math.round(distance)}m pour ${site.identifiantParcelle}` +
          (resultat.data.futurNetwork ? " (réseau en construction)" : ""),
      );
    }

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
