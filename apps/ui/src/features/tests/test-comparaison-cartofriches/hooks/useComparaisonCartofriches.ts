import { useCallback, useState } from "react";
import { normalizeParcelId } from "@mutafriches/shared-types";
import { enrichissementService } from "@shared/services/api/api.enrichissement.service";
import { cartofrichesService } from "@shared/services/api/api.cartofriches.service";
import { extraireCodeInsee } from "@shared/utils/cadastre.utils";
import { comparerSites, scoreCartofriches } from "../utils/comparaison";
import type { SiteCompare } from "../utils/export-csv";

interface EtatComparaison {
  site: SiteCompare | null;
  chargement: boolean;
  erreur: string | null;
}

/**
 * Comparaison Mutafriches / Cartofriches d'un site à la fois : chaque appel remplace
 * le résultat courant (pas d'accumulation).
 */
export function useComparaisonCartofriches() {
  const [etat, setEtat] = useState<EtatComparaison>({
    site: null,
    chargement: false,
    erreur: null,
  });

  const comparerSite = useCallback(async (identifiants: string[]): Promise<void> => {
    if (identifiants.length === 0) return;
    setEtat({ site: null, chargement: true, erreur: null });

    try {
      // Le code INSEE et l'identifiant Cartofriches se déduisent de l'entrée : on peut donc
      // lancer l'enrichissement Mutafriches et la recherche Cartofriches en parallèle.
      const identifiantsNormalises = identifiants.map((id) => normalizeParcelId(id));
      const codeInsee = extraireCodeInsee(identifiantsNormalises[0]);
      const identifiantCartofriches = identifiantsNormalises.join(",");

      const [enrich, recherche] = await Promise.all([
        enrichissementService.enrichirSite(identifiants),
        cartofrichesService.rechercher(identifiantCartofriches, codeInsee),
      ]);

      const site: SiteCompare = {
        identifiant: enrich.identifiantParcelle,
        commune: enrich.commune,
        trouveCartofriches: recherche.trouve,
        ficheUrl: recherche.ficheUrl,
        scoreCartofriches: scoreCartofriches(recherche.friche),
        lignes: comparerSites(enrich, recherche.friche),
      };
      setEtat({ site, chargement: false, erreur: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de la comparaison";
      setEtat({ site: null, chargement: false, erreur: message });
    }
  }, []);

  return {
    site: etat.site,
    chargement: etat.chargement,
    erreur: etat.erreur,
    comparerSite,
  };
}
