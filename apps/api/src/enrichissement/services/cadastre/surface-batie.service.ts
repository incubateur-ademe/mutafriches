import { Injectable, Logger } from "@nestjs/common";
import { BdnbService } from "../../adapters/bdnb/bdnb.service";
import { BdnbCacheRepository, EntreeCacheBdnb } from "../../repositories/bdnb-cache.repository";
import { mapParLots } from "../../../shared/utils";

export const BDNB_CACHE_TTL_JOURS = 30;
// Le coût d'un appel groupé est ~ (nombre de groupes / 10) : 10 parcelles tiennent en 1 à 2 pages
const PARCELLES_PAR_APPEL = 10;
const APPELS_SIMULTANES_MAX = 5;
const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Surface bâtie par parcelle : cache 30 jours, puis BDNB par appels groupés (ADR-0052).
 *
 * Ne lève jamais. Valeur par parcelle : nombre (0 = non bâtie), ou `null` si indisponible.
 */
@Injectable()
export class SurfaceBatieService {
  private readonly logger = new Logger(SurfaceBatieService.name);

  constructor(
    private readonly bdnbService: BdnbService,
    private readonly cache: BdnbCacheRepository,
  ) {}

  async getSurfaces(identifiants: string[]): Promise<Map<string, number | null>> {
    const uniques = [...new Set(identifiants)];
    const enCache = await this.cache.findByParcelles(uniques);
    const surfaces = new Map<string, number | null>();
    const aInterroger: string[] = [];

    for (const id of uniques) {
      const entree = enCache.get(id);
      if (entree && this.estFrais(entree)) {
        surfaces.set(id, entree.surfaceBati);
      } else {
        aInterroger.push(id);
      }
    }

    const aEnregistrer: Pick<EntreeCacheBdnb, "parcelleId" | "surfaceBati" | "groupes">[] = [];

    await mapParLots(this.decouper(aInterroger), APPELS_SIMULTANES_MAX, async (lot) => {
      const reponse = await this.bdnbService.getSurfacesBatiesParLot(lot);

      for (const id of lot) {
        const surfaceBdnb = reponse.success ? reponse.data?.[id] : undefined;
        if (surfaceBdnb) {
          surfaces.set(id, surfaceBdnb.surface);
          aEnregistrer.push({
            parcelleId: id,
            surfaceBati: surfaceBdnb.surface,
            groupes: surfaceBdnb.groupes,
          });
          continue;
        }

        // BDNB indisponible : une valeur périmée vaut mieux qu'une surface manquante
        const perimee = enCache.get(id);
        surfaces.set(id, perimee?.surfaceBati ?? null);
        if (perimee) {
          this.logger.warn(`BDNB indisponible pour ${id} : valeur du cache périmée conservée`);
        }
      }
    });

    await this.cache.enregistrer(aEnregistrer);

    this.logger.log(
      `Surface bâtie : ${uniques.length - aInterroger.length} parcelle(s) en cache, ${aInterroger.length} interrogée(s) sur la BDNB`,
    );

    return surfaces;
  }

  private estFrais(entree: EntreeCacheBdnb): boolean {
    return Date.now() - entree.dateRecuperation.getTime() < BDNB_CACHE_TTL_JOURS * JOUR_MS;
  }

  private decouper(identifiants: string[]): string[][] {
    const lots: string[][] = [];
    for (let i = 0; i < identifiants.length; i += PARCELLES_PAR_APPEL) {
      lots.push(identifiants.slice(i, i + PARCELLES_PAR_APPEL));
    }
    return lots;
  }
}
