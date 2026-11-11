import { ReactNode, useState } from "react";

export interface DsfrTabItem {
  /** Identifiant unique (utilisé pour les attributs aria-controls / aria-labelledby) */
  id: string;
  /** Libellé affiché sur l'onglet */
  label: string;
  /** Contenu du panneau correspondant */
  panel: ReactNode;
}

interface DsfrTabsProps {
  /** Liste des onglets et de leurs panneaux */
  tabs: DsfrTabItem[];
  /** Identifiant de l'onglet sélectionné par défaut (sinon le premier) */
  defaultTabId?: string;
  /** Label aria-label de la liste d'onglets */
  ariaLabel?: string;
  /** Garde la barre d'onglets visible en haut de la fenêtre pendant le défilement */
  ongletsFiges?: boolean;
  /** Appelé quand l'utilisateur change d'onglet (pas à l'affichage initial) */
  onTabChange?: (tabId: string) => void;
}

/**
 * Composant d'onglets DSFR — React local avec useState, sans dépendance au JS
 * de @gouvfr/dsfr. Respecte les classes (`fr-tabs`, `fr-tabs__list`,
 * `fr-tabs__tab`, `fr-tabs__panel`) et les attributs ARIA recommandés.
 */
export function DsfrTabs({
  tabs,
  defaultTabId,
  ariaLabel = "Onglets",
  ongletsFiges = false,
  onTabChange,
}: DsfrTabsProps) {
  const initialId = defaultTabId ?? tabs[0]?.id;
  const [activeId, setActiveId] = useState<string>(initialId);

  if (tabs.length === 0) return null;

  const selectionner = (tabId: string): void => {
    if (tabId === activeId) return;
    setActiveId(tabId);
    onTabChange?.(tabId);
  };

  return (
    // Le overflow hidden du DSFR empêche la barre d'onglets de rester collée ; clip rogne de la
    // même façon (le cadre des onglets déborde sinon sur le footer) sans créer de zone de défilement
    <div className={`fr-tabs${ongletsFiges ? " overflow-clip!" : ""}`}>
      <ul
        className={`fr-tabs__list${ongletsFiges ? " sticky top-[0px] z-[3] bg-[var(--background-default-grey)]" : ""}`}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <li key={tab.id} role="presentation">
              <button
                type="button"
                id={`tabpanel-${tab.id}`}
                className="fr-tabs__tab"
                tabIndex={isActive ? 0 : -1}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}-panel`}
                onClick={() => selectionner(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}-panel`}
            // Le DSFR garde un panneau inactif dans le flux : un onglet court hériterait de la
            // hauteur du plus long, d'où le display none explicite
            className={`fr-tabs__panel${isActive ? " fr-tabs__panel--selected" : ongletsFiges ? " hidden!" : ""}`}
            role="tabpanel"
            aria-labelledby={`tabpanel-${tab.id}`}
            tabIndex={0}
            hidden={!isActive}
          >
            {tab.panel}
          </div>
        );
      })}
    </div>
  );
}
