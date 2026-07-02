import { useState } from "react";
import { parseIdentifiantsColles } from "../utils/parse-identifiants";

interface CollageIdentifiantsPanelProps {
  onCharger: (listes: string[][]) => void;
  desactive: boolean;
}

/**
 * Saisie libre d'identifiants cadastraux à comparer (un identifiant = un site mono-parcelle).
 * Utilisé comme contenu de l'onglet « Coller des identifiants ».
 */
export function CollageIdentifiantsPanel({ onCharger, desactive }: CollageIdentifiantsPanelProps) {
  const [texte, setTexte] = useState("");
  const nbColles = parseIdentifiantsColles(texte).length;

  const chargerColles = (): void => {
    const listes = parseIdentifiantsColles(texte);
    if (listes.length > 0) {
      onCharger(listes);
    }
  };

  return (
    <div className="fr-p-2w">
      <div className="fr-input-group fr-mb-2w">
        <label className="fr-label" htmlFor="cartofriches-coller">
          Identifiants cadastraux
          <span className="fr-hint-text">
            Séparés par un retour ligne, une virgule ou un espace. Un identifiant par site.
          </span>
        </label>
        <textarea
          id="cartofriches-coller"
          className="fr-input"
          rows={5}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={"49353000AC0628\n49353000AV1255"}
          disabled={desactive}
        />
      </div>

      <button
        type="button"
        className="fr-btn fr-icon-search-line fr-btn--icon-left"
        onClick={chargerColles}
        disabled={desactive || nbColles === 0}
      >
        Comparer {nbColles > 0 ? `${nbColles} ` : ""}identifiant{nbColles > 1 ? "s" : ""}
      </button>
    </div>
  );
}
