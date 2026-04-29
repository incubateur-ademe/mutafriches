import React from "react";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { CCI92Site, CCI92_SITES_BY_COMMUNE } from "../data/parcelles-cci92";

interface CCI92SiteListProps {
  selectedSiteId: string | null;
  onSelectSite: (site: CCI92Site) => void;
  enrichmentCache: Map<string, EnrichissementOutputDto>;
}

export const CCI92SiteList: React.FC<CCI92SiteListProps> = ({
  selectedSiteId,
  onSelectSite,
  enrichmentCache,
}) => {
  const communes = Object.keys(CCI92_SITES_BY_COMMUNE).sort();

  return (
    <nav className="fr-sidemenu" aria-label="Liste des sites CCI 92">
      <div className="fr-sidemenu__inner">
        <div className="fr-sidemenu__title" id="cci92-sidemenu-title">
          Sites CCI 92
        </div>
        {communes.map((commune) => {
          const sites = CCI92_SITES_BY_COMMUNE[commune];
          return (
            <details key={commune} className="cci92-commune-group" open>
              <summary className="cci92-commune-group__summary">
                {commune} ({sites.length} site{sites.length > 1 ? "s" : ""})
              </summary>
              <ul className="fr-sidemenu__list">
                {sites.map((site) => {
                  const isSelected = site.idtup === selectedSiteId;
                  const isEnriched = enrichmentCache.has(site.idtup);
                  return (
                    <li key={site.idtup} className="fr-sidemenu__item">
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
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </nav>
  );
};
