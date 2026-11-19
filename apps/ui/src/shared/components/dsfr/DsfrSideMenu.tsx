import { useEffect, useState } from "react";

export interface DsfrSideMenuItem {
  /** Identifiant de la section visée (ancre `#id` dans la page) */
  id: string;
  label: string;
}

interface DsfrSideMenuProps {
  /** Identifiant unique du menu (attributs aria-controls / aria-labelledby) */
  id: string;
  titre: string;
  items: DsfrSideMenuItem[];
  /** Libellé du bouton qui déplie le menu sur mobile */
  libelleBouton?: string;
}

// Marge sous le haut de la fenêtre à partir de laquelle une section est considérée comme lue
const SEUIL_SECTION_PX = 120;

/** Section en cours de lecture : la dernière dont le titre a passé le haut de la fenêtre. */
function sectionCourante(ids: string[]): string | undefined {
  let courante = ids[0];
  for (const id of ids) {
    const section = document.getElementById(id);
    if (section && section.getBoundingClientRect().top <= SEUIL_SECTION_PX) courante = id;
  }
  return courante;
}

/**
 * Menu latéral DSFR servant de sommaire à une page longue : il reste visible pendant le
 * défilement (`fr-sidemenu--sticky`) et signale la section en cours de lecture. Le repli sur
 * mobile est géré par le JS du DSFR, comme les accordéons de la documentation.
 */
export function DsfrSideMenu({
  id,
  titre,
  items,
  libelleBouton = "Dans cette page",
}: DsfrSideMenuProps) {
  const [actif, setActif] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    let attente = 0;
    const actualiser = (): void => {
      // Un calcul par image au plus : le défilement émet bien plus d'événements
      cancelAnimationFrame(attente);
      attente = requestAnimationFrame(() => setActif(sectionCourante(ids)));
    };
    actualiser();
    window.addEventListener("scroll", actualiser, { passive: true });
    window.addEventListener("resize", actualiser);
    return () => {
      cancelAnimationFrame(attente);
      window.removeEventListener("scroll", actualiser);
      window.removeEventListener("resize", actualiser);
    };
  }, [items]);

  return (
    <nav className="fr-sidemenu fr-sidemenu--sticky" aria-labelledby={`${id}-titre`}>
      <div className="fr-sidemenu__inner">
        <button
          type="button"
          className="fr-sidemenu__btn"
          aria-controls={`${id}-contenu`}
          aria-expanded="false"
        >
          {libelleBouton}
        </button>
        <div className="fr-collapse" id={`${id}-contenu`}>
          <div className="fr-sidemenu__title" id={`${id}-titre`}>
            {titre}
          </div>
          <ul className="fr-sidemenu__list">
            {items.map((item) => {
              const estActif = item.id === actif;
              return (
                <li
                  key={item.id}
                  className={`fr-sidemenu__item${estActif ? " fr-sidemenu__item--active" : ""}`}
                >
                  <a
                    className="fr-sidemenu__link"
                    href={`#${item.id}`}
                    aria-current={estActif ? "location" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
