import React from "react";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { CCI92Site, CCI92_SITES_BY_COMMUNE } from "../data/parcelles-cci92";
import { CUSTOM_COMMUNE_LABEL } from "../hooks/useCustomSites";

interface CCI92SiteListProps {
  selectedSiteId: string | null;
  onSelectSite: (site: CCI92Site) => void;
  enrichmentCache: Map<string, EnrichissementOutputDto>;
  customSites: CCI92Site[];
  onAddSiteClick: () => void;
  onRemoveCustomSite: (idtup: string) => void;
  onClearCustomSites: () => void;
}

const renderSiteButton = (
  site: CCI92Site,
  selectedSiteId: string | null,
  isEnriched: boolean,
  onSelectSite: (site: CCI92Site) => void,
  onRemove?: (idtup: string) => void,
) => {
  const isSelected = site.idtup === selectedSiteId;
  return (
    <li key={site.idtup} className="fr-sidemenu__item cci92-site-row">
      <button
        type="button"
        className={`cci92-site-btn ${isSelected ? "cci92-site-btn--active" : ""}`}
        onClick={() => onSelectSite(site)}
        aria-current={isSelected ? "page" : undefined}
      >
        <span className="cci92-site-btn__label">
          {site.idtup}
          {site.parcelles.length > 1 && (
            <span className="fr-badge fr-badge--sm fr-badge--info fr-ml-1w">
              {site.parcelles.length} parcelles
            </span>
          )}
        </span>
        {isEnriched && (
          <span
            className="fr-icon-check-line fr-icon--sm cci92-site-btn__check"
            aria-label="Enrichi"
          />
        )}
      </button>
      {onRemove && (
        <button
          type="button"
          className="cci92-site-remove fr-icon-delete-line"
          onClick={() => onRemove(site.idtup)}
          aria-label={`Supprimer le site ${site.idtup}`}
          title="Supprimer ce site"
        />
      )}
    </li>
  );
};

export const CCI92SiteList: React.FC<CCI92SiteListProps> = ({
  selectedSiteId,
  onSelectSite,
  enrichmentCache,
  customSites,
  onAddSiteClick,
  onRemoveCustomSite,
  onClearCustomSites,
}) => {
  const communes = Object.keys(CCI92_SITES_BY_COMMUNE).sort();

  return (
    <nav className="fr-sidemenu" aria-label="Liste des sites CCI 92">
      <div className="fr-sidemenu__inner">
        <div className="fr-sidemenu__title" id="cci92-sidemenu-title">
          Sites CCI 92
        </div>

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
          <details className="cci92-commune-group" open>
            <summary className="cci92-commune-group__summary">
              {CUSTOM_COMMUNE_LABEL} ({customSites.length} site{customSites.length > 1 ? "s" : ""})
            </summary>
            <ul className="fr-sidemenu__list">
              {customSites.map((site) =>
                renderSiteButton(
                  site,
                  selectedSiteId,
                  enrichmentCache.has(site.idtup),
                  onSelectSite,
                  onRemoveCustomSite,
                ),
              )}
            </ul>
            <div className="cci92-clear-all">
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
          const sites = CCI92_SITES_BY_COMMUNE[commune];
          return (
            <details key={commune} className="cci92-commune-group" open>
              <summary className="cci92-commune-group__summary">
                {commune} ({sites.length} site{sites.length > 1 ? "s" : ""})
              </summary>
              <ul className="fr-sidemenu__list">
                {sites.map((site) =>
                  renderSiteButton(
                    site,
                    selectedSiteId,
                    enrichmentCache.has(site.idtup),
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
