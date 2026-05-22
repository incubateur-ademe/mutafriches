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
}

/**
 * Composant d'onglets DSFR — React local avec useState, sans dépendance au JS
 * de @gouvfr/dsfr. Respecte les classes (`fr-tabs`, `fr-tabs__list`,
 * `fr-tabs__tab`, `fr-tabs__panel`) et les attributs ARIA recommandés.
 */
export function DsfrTabs({ tabs, defaultTabId, ariaLabel = "Onglets" }: DsfrTabsProps) {
  const initialId = defaultTabId ?? tabs[0]?.id;
  const [activeId, setActiveId] = useState<string>(initialId);

  if (tabs.length === 0) return null;

  return (
    <div className="fr-tabs">
      <ul className="fr-tabs__list" role="tablist" aria-label={ariaLabel}>
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
                onClick={() => setActiveId(tab.id)}
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
            className={`fr-tabs__panel${isActive ? " fr-tabs__panel--selected" : ""}`}
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
