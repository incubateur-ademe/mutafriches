import { useCallback, useState } from "react";
import { enrichissementService } from "@shared/services/api/api.enrichissement.service";
import { cartofrichesService } from "@shared/services/api/api.cartofriches.service";
import { comparerSites, scoreCartofriches } from "../utils/comparaison";
import type { SiteCompare } from "../utils/export-csv";

interface Progression {
  enCours: number;
  total: number;
}

interface EtatComparaison {
  sites: SiteCompare[];
  chargement: boolean;
  erreur: string | null;
  progression: Progression | null;
}

/** Fusionne de nouveaux sites avec l'existant, en dédupliquant par identifiant (nouveaux prioritaires) */
function fusionnerSites(nouveaux: SiteCompare[], existants: SiteCompare[]): SiteCompare[] {
  const parId = new Map<string, SiteCompare>();
  for (const site of [...nouveaux, ...existants]) {
    if (!parId.has(site.identifiant)) {
      parId.set(site.identifiant, site);
    }
  }
  return [...parId.values()];
}

/**
 * Orchestration de la comparaison Mutafriches / Cartofriches pour une liste de sites
 * accumulée par l'utilisateur (sélection carte, liste de référence ou collage).
 */
export function useComparaisonCartofriches() {
  const [etat, setEtat] = useState<EtatComparaison>({
    sites: [],
    chargement: false,
    erreur: null,
    progression: null,
  });

  /** Enrichit, interroge Cartofriches et compare un site. Lève en cas d'échec. */
  const comparerUnSite = useCallback(async (identifiants: string[]): Promise<SiteCompare> => {
    const enrich = await enrichissementService.enrichirSite(identifiants);
    const recherche = await cartofrichesService.rechercher(
      enrich.identifiantParcelle,
      enrich.codeInsee,
    );
    return {
      identifiant: enrich.identifiantParcelle,
      commune: enrich.commune,
      trouveCartofriches: recherche.trouve,
      ficheUrl: recherche.ficheUrl,
      scoreCartofriches: scoreCartofriches(recherche.friche),
      lignes: comparerSites(enrich, recherche.friche),
    };
  }, []);

  /** Ajoute un site unique au comparatif */
  const ajouterSite = useCallback(
    async (identifiants: string[]): Promise<void> => {
      if (identifiants.length === 0) return;
      setEtat((prev) => ({ ...prev, chargement: true, erreur: null }));
      try {
        const site = await comparerUnSite(identifiants);
        setEtat((prev) => ({
          ...prev,
          sites: fusionnerSites([site], prev.sites),
          chargement: false,
        }));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur lors de la comparaison";
        setEtat((prev) => ({ ...prev, chargement: false, erreur: message }));
      }
    },
    [comparerUnSite],
  );

  /** Charge une liste de sites en lot (séquentiel pour préserver le cache commune) */
  const chargerSites = useCallback(
    async (listes: string[][]): Promise<void> => {
      const aTraiter = listes.filter((l) => l.length > 0);
      if (aTraiter.length === 0) return;

      setEtat((prev) => ({
        ...prev,
        chargement: true,
        erreur: null,
        progression: { enCours: 0, total: aTraiter.length },
      }));

      const nouveaux: SiteCompare[] = [];
      let echecs = 0;

      for (let i = 0; i < aTraiter.length; i += 1) {
        try {
          nouveaux.push(await comparerUnSite(aTraiter[i]));
        } catch {
          echecs += 1;
        }
        setEtat((prev) => ({
          ...prev,
          progression: { enCours: i + 1, total: aTraiter.length },
        }));
      }

      setEtat((prev) => ({
        sites: fusionnerSites(nouveaux, prev.sites),
        chargement: false,
        progression: null,
        erreur: echecs > 0 ? `${echecs} site(s) n'ont pas pu être comparés` : null,
      }));
    },
    [comparerUnSite],
  );

  const retirerSite = useCallback((identifiant: string): void => {
    setEtat((prev) => ({
      ...prev,
      sites: prev.sites.filter((s) => s.identifiant !== identifiant),
    }));
  }, []);

  const vider = useCallback((): void => {
    setEtat({ sites: [], chargement: false, erreur: null, progression: null });
  }, []);

  return {
    sites: etat.sites,
    chargement: etat.chargement,
    erreur: etat.erreur,
    progression: etat.progression,
    ajouterSite,
    chargerSites,
    retirerSite,
    vider,
  };
}
