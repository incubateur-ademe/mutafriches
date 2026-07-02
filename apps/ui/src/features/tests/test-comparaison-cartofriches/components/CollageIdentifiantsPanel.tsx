import { useState } from "react";
import { parseIdentifiantsColles } from "../utils/parse-identifiants";
import "./comparaison-cartofriches.css";

interface CollageIdentifiantsPanelProps {
  /** Compare un site à partir de ses identifiants */
  onComparer: (identifiants: string[]) => void;
  desactive: boolean;
}

/**
 * Saisie libre d'identifiants cadastraux. Chaque identifiant collé peut être comparé
 * unitairement (un identifiant = un site mono-parcelle).
 */
export function CollageIdentifiantsPanel({ onComparer, desactive }: CollageIdentifiantsPanelProps) {
  const [texte, setTexte] = useState("");
  const identifiants = parseIdentifiantsColles(texte).map((liste) => liste[0]);

  return (
    <div className="fr-p-2w">
      <div className="fr-input-group fr-mb-2w">
        <label className="fr-label" htmlFor="cartofriches-coller">
          Identifiants cadastraux
          <span className="fr-hint-text">
            Séparés par un retour ligne, une virgule ou un espace.
          </span>
        </label>
        <textarea
          id="cartofriches-coller"
          className="fr-input"
          rows={4}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={"49353000AC0628\n49353000AV1255"}
          disabled={desactive}
        />
      </div>

      {identifiants.length > 0 ? (
        <ul className="mf-cf-sidebar__list">
          {identifiants.map((identifiant) => (
            <li key={identifiant}>
              <button
                type="button"
                className="mf-cf-site-btn"
                onClick={() => onComparer([identifiant])}
                disabled={desactive}
              >
                <span>{identifiant}</span>
                <span className="fr-icon-search-line fr-icon--sm" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
