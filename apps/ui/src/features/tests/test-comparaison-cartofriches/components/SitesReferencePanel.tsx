import { SITES_REFERENCE } from "../config/sites-reference";
import "./comparaison-cartofriches.css";

interface SitesReferencePanelProps {
  /** Compare un site (ses parcelles) */
  onComparerSite: (parcelles: string[]) => void;
  /** Désactive les actions pendant un chargement */
  desactive: boolean;
}

/**
 * Onglet « Sites de référence » : liste des sites prédéfinis. Un clic compare le site.
 */
export function SitesReferencePanel({ onComparerSite, desactive }: SitesReferencePanelProps) {
  if (SITES_REFERENCE.length === 0) {
    return (
      <div className="fr-p-2w">
        <p className="fr-text--sm" style={{ color: "var(--text-mention-grey)" }}>
          Aucun site de référence défini. Éditez <code>sites-reference.ts</code> ou utilisez les
          autres onglets.
        </p>
      </div>
    );
  }

  return (
    <div className="fr-p-2w">
      <ul className="mf-cf-sidebar__list">
        {SITES_REFERENCE.map((site) => {
          const libelle = site.label ?? site.parcelles.join(", ");
          return (
            <li key={site.parcelles.join(",")}>
              <button
                type="button"
                className="mf-cf-site-btn"
                onClick={() => onComparerSite(site.parcelles)}
                disabled={desactive}
                title={site.parcelles.join(", ")}
              >
                <span>
                  {libelle}
                  <span className="fr-badge fr-badge--sm fr-badge--info fr-ml-1w">
                    {site.parcelles.length} parcelle{site.parcelles.length > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="fr-icon-search-line fr-icon--sm" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
