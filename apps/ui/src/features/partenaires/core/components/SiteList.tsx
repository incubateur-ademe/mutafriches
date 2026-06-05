import React from "react";
import type { PartnerSite } from "../types";
import { CUSTOM_COMMUNE_LABEL } from "../hooks/useCustomSites";

interface SiteListProps {
  titre: string;
  sitesByCommune: Record<string, PartnerSite[]>;
  selectedSiteId: string | null;
  onSelectSite: (site: PartnerSite) => void;
  enrichedSiteIds: Set<string>;
  customSites: PartnerSite[];
  onAddSiteClick: () => void;
  onRemoveCustomSite: (idtup: string) => void;
  onClearCustomSites: () => void;
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
          {site.idtup}
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
  titre,
  sitesByCommune,
  selectedSiteId,
  onSelectSite,
  enrichedSiteIds,
  customSites,
  onAddSiteClick,
  onRemoveCustomSite,
  onClearCustomSites,
}) => {
  const communes = Object.keys(sitesByCommune).sort();

  return (
    <nav className="fr-sidemenu" aria-label={titre}>
      <div className="fr-sidemenu__inner">
        <div className="fr-sidemenu__title">{titre}</div>

        <div className="fr-mb-2w">
          <button
            type="button"
            className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-add-line fr-btn--icon-left"
            onClick={onAddSiteClick}
          >
            Ajouter un site
          </button>
        </div>

        {customSites.length > 0 && (
          <details className="mf-ms-commune-group" open>
            <summary className="mf-ms-commune-group__summary">
              {CUSTOM_COMMUNE_LABEL} ({customSites.length} site{customSites.length > 1 ? "s" : ""})
            </summary>
            <ul className="fr-sidemenu__list">
              {customSites.map((site) =>
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

        {communes.map((commune) => {
          const sites = sitesByCommune[commune];
          return (
            <details key={commune} className="mf-ms-commune-group" open>
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
          );
        })}
      </div>
    </nav>
  );
};
