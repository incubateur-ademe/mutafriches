import { SITES_REFERENCE } from "../config/sites-reference";
import "./comparaison-cartofriches.css";

interface SitesReferenceSidebarProps {
  /** Compare un site (ses parcelles) et l'ajoute au comparatif */
  onComparerSite: (parcelles: string[]) => void;
  /** Compare tous les sites de référence en lot */
  onComparerTout: () => void;
  /** Indique si un site (ses parcelles) a déjà été comparé */
  estCompare: (parcelles: string[]) => boolean;
  /** Désactive les actions pendant un chargement */
  desactive: boolean;
}

/**
 * Bandeau latéral listant les sites de référence à comparer. Un clic sur un site le compare
 * et l'ajoute au comparatif ; une coche indique les sites déjà traités.
 */
export function SitesReferenceSidebar({
  onComparerSite,
  onComparerTout,
  estCompare,
  desactive,
}: SitesReferenceSidebarProps) {
  const nb = SITES_REFERENCE.length;

  return (
    <nav className="fr-sidemenu" aria-label="Sites de référence">
      <div className="fr-sidemenu__inner">
        <div className="fr-sidemenu__title">Sites de référence</div>
        <p className="fr-text--xs fr-mb-2w" style={{ color: "var(--text-mention-grey)" }}>
          {nb} site{nb > 1 ? "s" : ""} prédéfini{nb > 1 ? "s" : ""}
        </p>

        {nb > 0 ? (
          <>
            <div className="fr-mb-2w">
              <button
                type="button"
                className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-play-line fr-btn--icon-left"
                onClick={onComparerTout}
                disabled={desactive}
              >
                Comparer tous les sites
              </button>
            </div>

            <ul className="mf-cf-sidebar__list">
              {SITES_REFERENCE.map((site) => {
                const compare = estCompare(site.parcelles);
                const libelle = site.label ?? site.parcelles.join(", ");
                return (
                  <li key={site.parcelles.join(",")}>
                    <button
                      type="button"
                      className={`mf-cf-site-btn ${compare ? "mf-cf-site-btn--compare" : ""}`}
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
                      {compare ? (
                        <span
                          className="fr-icon-check-line fr-icon--sm mf-cf-site-btn__check"
                          aria-label="Déjà comparé"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="fr-text--sm" style={{ color: "var(--text-mention-grey)" }}>
            Aucun site de référence défini. Éditez <code>sites-reference.ts</code> ou utilisez la
            carte / le collage d'identifiants.
          </p>
        )}
      </div>
    </nav>
  );
}
