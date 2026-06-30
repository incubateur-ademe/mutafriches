import React, { useMemo, useState } from "react";
import type { PartnerSite } from "../types";

interface SiteListProps {
  sitesByCommune: Record<string, PartnerSite[]>;
  selectedSiteId: string | null;
  onSelectSite: (site: PartnerSite) => void;
  /** Sites avec une saisie « Connaissance terrain » en localStorage (simple check). */
  qualifiedSiteIds: Set<string>;
  /** Sites avec une mutabilité calculée en localStorage (double check). */
  evaluatedSiteIds: Set<string>;
  onAddSiteClick: () => void;
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

// Simple check = qualification saisie en local ; double check = qualification + mutabilité.
const renderStatusIcon = (qualified: boolean, evaluated: boolean) => {
  if (evaluated) {
    return (
      <span
        className="mf-ms-site-btn__check"
        aria-label="Qualifié et mutabilité calculée"
        title="Qualifié et mutabilité calculée"
      >
        <span className="fr-icon-check-line fr-icon--sm" aria-hidden="true" />
        <span
          className="fr-icon-check-line fr-icon--sm"
          aria-hidden="true"
          style={{ marginLeft: "-0.45rem" }}
        />
      </span>
    );
  }
  if (qualified) {
    return (
      <span
        className="fr-icon-check-line fr-icon--sm mf-ms-site-btn__check"
        aria-label="Qualifié"
        title="Qualifié"
      />
    );
  }
  return null;
};

const renderSiteButton = (
  site: PartnerSite,
  selectedSiteId: string | null,
  qualified: boolean,
  evaluated: boolean,
  onSelectSite: (site: PartnerSite) => void,
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
          <span className="mf-ms-site-btn__name">{site.nom ?? site.idtup}</span>
          <span className="fr-badge fr-badge--sm fr-badge--info">
            {site.parcelles.length} parcelle{site.parcelles.length > 1 ? "s" : ""}
          </span>
        </span>
        {renderStatusIcon(qualified, evaluated)}
      </button>
    </li>
  );
};

export const SiteList: React.FC<SiteListProps> = ({
  sitesByCommune,
  selectedSiteId,
  onSelectSite,
  qualifiedSiteIds,
  evaluatedSiteIds,
  onAddSiteClick,
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

  // Récap (total du jeu de données)
  const totalSites = useMemo(
    () => Object.values(sitesByCommune).reduce((n, s) => n + s.length, 0),
    [sitesByCommune],
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

  const aucunResultat = isSearching && filteredCommunes.length === 0;

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
                  qualifiedSiteIds.has(site.idtup),
                  evaluatedSiteIds.has(site.idtup),
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
