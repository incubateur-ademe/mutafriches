import { Injectable, Logger } from "@nestjs/common";
import {
  CartofrichesCommuneResult,
  CartofrichesRechercheResult,
  FricheCarte,
  FrichesCerema,
} from "@mutafriches/shared-types";
import { CartofrichesAdapter, GeoFricheFeature } from "./cartofriches.adapter";
import {
  CARTOFRICHES_CACHE_TTL_MS,
  CARTOFRICHES_FICHE_URL_BASE,
  CARTOFRICHES_SOURCE,
} from "./cartofriches.constants";
import { nettoyerFriche, normaliserIdentifiant, parserRefcad } from "./cartofriches.utils";

interface CacheEntry {
  friches: FrichesCerema[];
  expiry: number;
}

interface GeoCacheEntry {
  features: GeoFricheFeature[];
  expiry: number;
}

/**
 * Service de recherche d'une friche Cartofriches par identifiant cadastral.
 *
 * Stratégie : l'API Cerema ne permet pas la recherche directe par parcelle. On récupère
 * donc toutes les friches de la commune (cache mémoire court) puis on matche par référence
 * cadastrale (`unite_fonciere_refcad`).
 */
@Injectable()
export class CartofrichesService {
  private readonly logger = new Logger(CartofrichesService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly geoCache = new Map<string, GeoCacheEntry>();

  constructor(private readonly adapter: CartofrichesAdapter) {}

  /**
   * Récupère les friches d'une commune pour l'affichage carte + liste (emprises incluses).
   */
  async getFrichesCommune(codeInsee: string): Promise<CartofrichesCommuneResult> {
    const startTime = Date.now();

    const cached = this.geoCache.get(codeInsee);
    let features: GeoFricheFeature[];

    if (cached && cached.expiry > Date.now()) {
      features = cached.features;
    } else {
      const result = await this.adapter.getGeofrichesParCommune(codeInsee);
      if (!result.success || !result.data) {
        return {
          friches: [],
          source: CARTOFRICHES_SOURCE,
          responseTimeMs: Date.now() - startTime,
          erreur: result.error,
        };
      }
      features = result.data;
      this.geoCache.set(codeInsee, {
        features,
        expiry: Date.now() + CARTOFRICHES_CACHE_TTL_MS,
      });
    }

    const friches: FricheCarte[] = features.map((feature) => {
      const props = feature.properties;
      return {
        nom: props.site_nom ?? null,
        refcad: parserRefcad(props.unite_fonciere_refcad),
        surface: props.unite_fonciere_surface ?? props.site_surface ?? null,
        geometry: feature.geometry,
      };
    });

    return {
      friches,
      source: CARTOFRICHES_SOURCE,
      responseTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Recherche la friche Cartofriches correspondant à un identifiant cadastral.
   *
   * @param identifiant Identifiant cadastral Mutafriches (mono ou multi-parcelle séparé par virgules)
   * @param codeInsee Code INSEE de la commune (issu de l'enrichissement Mutafriches)
   */
  async rechercher(identifiant: string, codeInsee: string): Promise<CartofrichesRechercheResult> {
    const startTime = Date.now();
    const identifiantsCibles = identifiant
      .split(",")
      .map((id) => normaliserIdentifiant(id))
      .filter((id) => id.length > 0);

    const frichesResult = await this.chargerFrichesCommuneCache(codeInsee);

    if (!frichesResult.success) {
      return {
        trouve: false,
        friche: null,
        refcadParsees: [],
        nbCandidats: 0,
        ficheUrl: null,
        source: CARTOFRICHES_SOURCE,
        responseTimeMs: Date.now() - startTime,
        erreur: frichesResult.error,
      };
    }

    const candidats = frichesResult.friches;

    for (const friche of candidats) {
      const refcad = parserRefcad(friche.unite_fonciere_refcad);
      const correspond = refcad.some((ref) => identifiantsCibles.includes(ref));
      if (correspond) {
        return {
          trouve: true,
          friche: nettoyerFriche(friche),
          refcadParsees: refcad,
          nbCandidats: candidats.length,
          ficheUrl: friche.site_id ? `${CARTOFRICHES_FICHE_URL_BASE}${friche.site_id}` : null,
          source: CARTOFRICHES_SOURCE,
          responseTimeMs: Date.now() - startTime,
        };
      }
    }

    this.logger.debug(
      `Aucune friche Cartofriches pour ${identifiant} (commune ${codeInsee}, ${candidats.length} candidats)`,
    );

    return {
      trouve: false,
      friche: null,
      refcadParsees: [],
      nbCandidats: candidats.length,
      ficheUrl: null,
      source: CARTOFRICHES_SOURCE,
      responseTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Récupère les friches d'une commune (endpoint friches/, sans géométrie) avec cache mémoire court.
   * Utilisé par la recherche par identifiant cadastral.
   */
  private async chargerFrichesCommuneCache(
    codeInsee: string,
  ): Promise<{ success: boolean; friches: FrichesCerema[]; error?: string }> {
    const cached = this.cache.get(codeInsee);
    if (cached && cached.expiry > Date.now()) {
      return { success: true, friches: cached.friches };
    }

    const result = await this.adapter.getFrichesParCommune(codeInsee);
    if (!result.success || !result.data) {
      return { success: false, friches: [], error: result.error };
    }

    this.cache.set(codeInsee, {
      friches: result.data,
      expiry: Date.now() + CARTOFRICHES_CACHE_TTL_MS,
    });

    return { success: true, friches: result.data };
  }
}
