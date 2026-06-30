import { useCallback, useEffect, useState } from "react";
import type { PartenaireSiteOutputDto } from "@mutafriches/shared-types";
import { partenairesService } from "@shared/services/api/api.partenaires.service";
import { groupByCommune } from "../group";
import type { PartnerConfig, PartnerSite } from "../types";

// Mappe un site renvoyé par l'API vers le modèle d'affichage.
// Le nom par défaut (rue, phase 2) n'existe pas encore : on reproduit le défaut
// historique « première parcelle » pour les sites multi-parcelles.
function toPartnerSite(site: PartenaireSiteOutputDto): PartnerSite {
  const nom =
    site.nom ?? site.nomDefaut ?? (site.parcelles.length > 1 ? site.parcelles[0] : undefined);
  return { id: site.id, idtup: site.idtup, commune: site.commune, parcelles: site.parcelles, nom };
}

/**
 * Charge les sites d'un partenaire depuis l'API, avec repli sur la config statique.
 * Rendu instantané depuis le statique, remplacé par la donnée API au retour (ADR-0021, phase 1).
 */
export function usePartenaireSites(config: PartnerConfig): {
  sitesByCommune: Record<string, PartnerSite[]>;
  renommerSite: (id: string, nom: string) => Promise<PartnerSite>;
} {
  const [sitesByCommune, setSitesByCommune] = useState(config.sitesByCommune);

  useEffect(() => {
    let cancelled = false;
    partenairesService
      .getPartenaire(config.slug)
      .then((data) => {
        if (cancelled || data.sites.length === 0) return;
        setSitesByCommune(groupByCommune(data.sites.map(toPartnerSite)));
      })
      .catch(() => {
        // API indisponible ou partenaire non seedé : on garde le repli statique.
      });
    return () => {
      cancelled = true;
    };
  }, [config.slug]);

  const renommerSite = useCallback(
    async (id: string, nom: string): Promise<PartnerSite> => {
      const updated = toPartnerSite(await partenairesService.renommerSite(config.slug, id, nom));
      setSitesByCommune((prev) => {
        const next: Record<string, PartnerSite[]> = {};
        for (const [commune, sites] of Object.entries(prev)) {
          next[commune] = sites.map((s) => (s.id === id ? updated : s));
        }
        return next;
      });
      return updated;
    },
    [config.slug],
  );

  return { sitesByCommune, renommerSite };
}
