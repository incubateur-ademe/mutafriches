import { useCallback, useState } from "react";
import { enrichissementService } from "@shared/services/api/api.enrichissement.service";
import { cartofrichesService } from "@shared/services/api/api.cartofriches.service";
import { comparerSites, scoreCartofriches } from "../utils/comparaison";
import type { SiteCompare } from "../utils/export-csv";

interface EtatComparaison {
  sites: SiteCompare[];
  chargement: boolean;
  erreur: string | null;
}

/**
 * Orchestration de la comparaison Mutafriches / Cartofriches pour une liste de sites
 * accumulée par l'utilisateur (sélection sur la carte).
 */
export function useComparaisonCartofriches() {
  const [etat, setEtat] = useState<EtatComparaison>({
    sites: [],
    chargement: false,
    erreur: null,
  });

  const ajouterSite = useCallback(async (identifiants: string[]): Promise<void> => {
    if (identifiants.length === 0) return;
    setEtat((prev) => ({ ...prev, chargement: true, erreur: null }));

    try {
      // 1. Enrichissement Mutafriches
      const enrich = await enrichissementService.enrichirSite(identifiants);

      // 2. Recherche Cartofriches (proxy backend)
      const recherche = await cartofrichesService.rechercher(
        enrich.identifiantParcelle,
        enrich.codeInsee,
      );

      // 3. Comparaison des données sources
      const lignes = comparerSites(enrich, recherche.friche);

      const site: SiteCompare = {
        identifiant: enrich.identifiantParcelle,
        commune: enrich.commune,
        trouveCartofriches: recherche.trouve,
        ficheUrl: recherche.ficheUrl,
        scoreCartofriches: scoreCartofriches(recherche.friche),
        lignes,
      };

      setEtat((prev) => ({
        sites: [site, ...prev.sites.filter((s) => s.identifiant !== site.identifiant)],
        chargement: false,
        erreur: null,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de la comparaison";
      setEtat((prev) => ({ ...prev, chargement: false, erreur: message }));
    }
  }, []);

  const retirerSite = useCallback((identifiant: string): void => {
    setEtat((prev) => ({
      ...prev,
      sites: prev.sites.filter((s) => s.identifiant !== identifiant),
    }));
  }, []);

  const vider = useCallback((): void => {
    setEtat({ sites: [], chargement: false, erreur: null });
  }, []);

  return {
    sites: etat.sites,
    chargement: etat.chargement,
    erreur: etat.erreur,
    ajouterSite,
    retirerSite,
    vider,
  };
}
