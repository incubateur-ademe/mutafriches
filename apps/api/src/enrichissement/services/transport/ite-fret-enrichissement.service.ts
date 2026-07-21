import { Injectable, Logger } from "@nestjs/common";
import { DistanceIte, SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { IteFretRepository } from "../../repositories/ite-fret.repository";

/** Seuil de distance pour catégoriser une ITE comme "proche" (en mètres) */
const SEUIL_PROXIMITE_ITE_M = 1000;

/**
 * Service d'enrichissement Installations Terminales Embranchées (ITE) fret
 *
 * Source : Cerema - Base ITE 3000
 * Détermine la catégorie de proximité d'une ITE par rapport au site :
 *   - MOINS_1KM_BON_ETAT     : ITE à moins d'1 km, en bon état
 *   - MOINS_1KM_MAUVAIS_ETAT : ITE à moins d'1 km, en mauvais état
 *   - PLUS_1KM               : aucune ITE à moins d'1 km
 */
@Injectable()
export class IteFretEnrichissementService {
  private readonly logger = new Logger(IteFretEnrichissementService.name);

  constructor(private readonly iteFretRepository: IteFretRepository) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(`Pas de coordonnées disponibles pour le site ${site.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.ITE_FRET);
      champsManquants.push("distanceIte");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    try {
      this.logger.debug(`Recherche ITE fret pour ${site.identifiantParcelle}`);

      const iteProche = await this.iteFretRepository.findIteProche(
        site.coordonnees.latitude,
        site.coordonnees.longitude,
      );

      site.distanceIte = this.categoriserDistance(iteProche?.distance, iteProche?.etat);
      site.distanceIteMetres = iteProche ? Math.round(iteProche.distance) : undefined;
      sourcesUtilisees.push(SourceEnrichissement.ITE_FRET);

      if (iteProche === null) {
        this.logger.log(
          `Aucune ITE trouvée à proximité pour ${site.identifiantParcelle} (catégorie: ${site.distanceIte})`,
        );
      } else {
        this.logger.log(
          `ITE "${iteProche.nom}" trouvée à ${Math.round(iteProche.distance)}m ` +
            `(état: ${iteProche.etat ?? "inconnu"}, catégorie: ${site.distanceIte}) ` +
            `pour ${site.identifiantParcelle}`,
        );
      }
    } catch (error) {
      this.logger.error("Erreur lors de la recherche ITE fret:", error);
      sourcesEchouees.push(SourceEnrichissement.ITE_FRET);
      champsManquants.push("distanceIte");
      site.distanceIte = undefined;
      site.distanceIteMetres = undefined;
    }

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    };
  }

  /**
   * Catégorise la distance et l'état en l'une des 3 valeurs de DistanceIte.
   *
   * Règles :
   * - Pas d'ITE trouvée OU distance >= 1000m → PLUS_1KM
   * - Distance < 1000m + état "bon" → MOINS_1KM_BON_ETAT
   * - Distance < 1000m + état autre (mauvais ou inconnu) → MOINS_1KM_MAUVAIS_ETAT
   *
   * Le cas "état inconnu et < 1km" est rare mais possible (donnée Cerema manquante) ;
   * on le classe par sécurité comme MAUVAIS pour éviter de surestimer le potentiel.
   */
  private categoriserDistance(
    distance: number | undefined,
    etat: string | null | undefined,
  ): DistanceIte {
    if (distance === undefined || distance >= SEUIL_PROXIMITE_ITE_M) {
      return DistanceIte.PLUS_1KM;
    }
    return etat === "bon" ? DistanceIte.MOINS_1KM_BON_ETAT : DistanceIte.MOINS_1KM_MAUVAIS_ETAT;
  }
}
