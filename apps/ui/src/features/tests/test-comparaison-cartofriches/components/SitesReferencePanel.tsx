import { SITES_REFERENCE } from "../config/sites-reference";
import "./comparaison-cartofriches.css";

interface SitesReferencePanelProps {
  /** Compare un site (ses parcelles) */
  onComparerSite: (parcelles: string[]) => void;
  /** Désactive les actions pendant un chargement */
  desactive: boolean;
}

/**
 * Onglet « Sites de référence » : cartes fines empilées. Un clic compare le site.
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
      <ul className="mf-cf-site-cards">
        {SITES_REFERENCE.map((site) => {
          const titre = site.label ?? site.parcelles.join(", ");
          const nbParcelles = site.parcelles.length;
          const meta = [
            site.commune,
            `${nbParcelles} parcelle${nbParcelles > 1 ? "s" : ""}`,
            site.parcelles[0],
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={site.parcelles.join(",")}>
              <button
                type="button"
                className="mf-cf-site-card"
                onClick={() => onComparerSite(site.parcelles)}
                disabled={desactive}
                title={site.parcelles.join(", ")}
              >
                <span>
                  <span className="mf-cf-site-card__title">{titre}</span>
                  <span className="mf-cf-site-card__meta">{meta}</span>
                </span>
                <span
                  className="fr-icon-search-line fr-icon--sm mf-cf-site-card__action"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
