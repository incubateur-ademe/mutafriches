import React, { useMemo, useState } from "react";
import type { PartnerSite } from "../types";
import { CUSTOM_COMMUNE_LABEL } from "../hooks/useCustomSites";

interface SiteListProps {
  sitesByCommune: Record<string, PartnerSite[]>;
  selectedSiteId: string | null;
  onSelectSite: (site: PartnerSite) => void;
  enrichedSiteIds: Set<string>;
  customSites: PartnerSite[];
  onAddSiteClick: () => void;
  onRemoveCustomSite: (idtup: string) => void;
  onClearCustomSites: () => void;
}

// Au-delà de ce nombre de communes, les groupes sont repliés par défaut.
const COLLAPSE_THRESHOLD = 6;

// Un site correspond à la recherche si sa commune, son libellé, son idtup ou une de ses
// parcelles contient la requête.
function matchSite(site: PartnerSite, q: string): boolean {
  return (
    site.commune.toLowerCase().includes(q) ||
    (site.nom?.toLowerCase().includes(q) ?? false) ||
    site.idtup.toLowerCase().includes(q) ||
    site.parcelles.some((p) => p.toLowerCase().includes(q))
  );
}

const renderSiteButton = (
  site: PartnerSite,
  selectedSiteId: string | null,
  isEnriched: boolean,
  onSelectSite: (site: PartnerSite) => void,
  onRemove?: (idtup: string) => void,
) => {
  const isSelected = site.idtup === selectedSiteId;
  return (
    <li key={site.idtup} className="fr-sidemenu__item mf-ms-site-row">
      <button
        type="button"
        className={`mf-ms-site-btn ${isSelected ? "mf-ms-site-btn--active" : ""}`}
        onClick={() => onSelectSite(site)}
        aria-current={isSelected ? "page" : undefined}
      >
        <span className="mf-ms-site-btn__label">
          {site.nom ?? site.idtup}
          <span className="fr-badge fr-badge--sm fr-badge--info fr-ml-1w">
            {site.parcelles.length} parcelle{site.parcelles.length > 1 ? "s" : ""}
          </span>
        </span>
        {isEnriched && (
          <span
            className="fr-icon-check-line fr-icon--sm mf-ms-site-btn__check"
            aria-label="Enrichi"
          />
        )}
      </button>
      {onRemove && (
        <button
          type="button"
          className="mf-ms-site-remove fr-icon-delete-line"
          onClick={() => onRemove(site.idtup)}
          aria-label={`Supprimer le site ${site.idtup}`}
          title="Supprimer ce site"
        />
      )}
    </li>
  );
};

export const SiteList: React.FC<SiteListProps> = ({
  sitesByCommune,
  selectedSiteId,
  onSelectSite,
  enrichedSiteIds,
  customSites,
  onAddSiteClick,
  onRemoveCustomSite,
  onClearCustomSites,
}) => {
  const communes = useMemo(() => Object.keys(sitesByCommune).sort(), [sitesByCommune]);

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  // Repli par défaut : tout ouvert si peu de communes, sinon tout replié.
  const [openSet, setOpenSet] = useState<Set<string>>(() =>
    communes.length <= COLLAPSE_THRESHOLD ? new Set(communes) : new Set(),
  );

  const isOpen = (commune: string) => isSearching || openSet.has(commune);
  const handleToggle = (commune: string, open: boolean) => {
    if (isSearching) return; // en recherche, l'ouverture est forcée
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (open) next.add(commune);
      else next.delete(commune);
      return next;
    });
  };

  // Récap (totaux du jeu de données complet, sites perso inclus)
  const totalSites = useMemo(
    () => Object.values(sitesByCommune).reduce((n, s) => n + s.length, 0) + customSites.length,
    [sitesByCommune, customSites.length],
  );

  // Filtrage par la recherche
  const filteredCommunes = useMemo(() => {
    return communes
      .map((commune) => {
        const all = sitesByCommune[commune];
        if (!isSearching) return { commune, sites: all };
        const communeMatch = commune.toLowerCase().includes(q);
        return { commune, sites: communeMatch ? all : all.filter((s) => matchSite(s, q)) };
      })
      .filter((g) => g.sites.length > 0);
  }, [communes, sitesByCommune, isSearching, q]);

  const filteredCustom = useMemo(
    () => (isSearching ? customSites.filter((s) => matchSite(s, q)) : customSites),
    [customSites, isSearching, q],
  );

  const aucunResultat = isSearching && filteredCommunes.length === 0 && filteredCustom.length === 0;

  return (
    <nav className="fr-sidemenu">
      <div className="fr-sidemenu__inner">
        <p className="fr-text--xs fr-mb-1w" style={{ color: "var(--text-mention-grey)" }}>
          {totalSites} site{totalSites > 1 ? "s" : ""} · {communes.length} commune
          {communes.length > 1 ? "s" : ""}
        </p>

        <div className="fr-mb-2w">
          <button
            type="button"
            className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-add-line fr-btn--icon-left"
            onClick={onAddSiteClick}
          >
            Ajouter un site
          </button>
        </div>

        <div className="fr-input-group fr-mb-2w">
          <label className="fr-label fr-sr-only" htmlFor="mf-ms-site-search">
            Rechercher un site
          </label>
          <input
            id="mf-ms-site-search"
            type="search"
            className="fr-input fr-input--sm"
            placeholder="Rechercher (commune, IDU…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {aucunResultat && (
          <p className="fr-text--sm fr-mb-2w" style={{ color: "var(--text-mention-grey)" }}>
            Aucun site ne correspond à « {query} ».
          </p>
        )}

        {filteredCustom.length > 0 && (
          <details className="mf-ms-commune-group" open>
            <summary className="mf-ms-commune-group__summary">
              {CUSTOM_COMMUNE_LABEL} ({filteredCustom.length} site
              {filteredCustom.length > 1 ? "s" : ""})
            </summary>
            <ul className="fr-sidemenu__list">
              {filteredCustom.map((site) =>
                renderSiteButton(
                  site,
                  selectedSiteId,
                  enrichedSiteIds.has(site.idtup),
                  onSelectSite,
                  onRemoveCustomSite,
                ),
              )}
            </ul>
            <div className="mf-ms-clear-all">
              <button
                type="button"
                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
                onClick={onClearCustomSites}
              >
                Tout effacer
              </button>
            </div>
          </details>
        )}

        {filteredCommunes.map(({ commune, sites }) => (
          <details
            key={commune}
            className="mf-ms-commune-group"
            open={isOpen(commune)}
            onToggle={(e) => handleToggle(commune, e.currentTarget.open)}
          >
            <summary className="mf-ms-commune-group__summary">
              {commune} ({sites.length} site{sites.length > 1 ? "s" : ""})
            </summary>
            <ul className="fr-sidemenu__list">
              {sites.map((site) =>
                renderSiteButton(
                  site,
                  selectedSiteId,
                  enrichedSiteIds.has(site.idtup),
                  onSelectSite,
                ),
              )}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
};
