import { useState } from "react";
import { SITES_REFERENCE } from "../config/sites-reference";
import { parseIdentifiantsColles } from "../utils/parse-identifiants";

interface PrechargementPanelProps {
  onCharger: (listes: string[][]) => void;
  desactive: boolean;
}

/**
 * Panneau de préchargement d'une liste de sites : liste de référence (éditée dans le code)
 * et collage libre d'identifiants cadastraux.
 */
export function PrechargementPanel({ onCharger, desactive }: PrechargementPanelProps) {
  const [texte, setTexte] = useState("");

  const chargerReference = (): void => {
    onCharger(SITES_REFERENCE.map((site) => site.parcelles));
  };

  const chargerColles = (): void => {
    const listes = parseIdentifiantsColles(texte);
    if (listes.length > 0) {
      onCharger(listes);
    }
  };

  const nbColles = parseIdentifiantsColles(texte).length;

  return (
    <div className="fr-callout fr-mb-4w">
      <h2 className="fr-callout__title fr-h5">Précharger une liste de sites</h2>

      <div className="fr-mb-3w">
        <button
          type="button"
          className="fr-btn fr-btn--secondary"
          onClick={chargerReference}
          disabled={desactive || SITES_REFERENCE.length === 0}
        >
          Charger les {SITES_REFERENCE.length} site{SITES_REFERENCE.length > 1 ? "s" : ""} de
          référence
        </button>
      </div>

      <div className="fr-input-group fr-mb-2w">
        <label className="fr-label" htmlFor="cartofriches-coller">
          Ou coller des identifiants cadastraux
          <span className="fr-hint-text">
            Séparés par un retour ligne, une virgule ou un espace. Un identifiant par site.
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

      <button
        type="button"
        className="fr-btn"
        onClick={chargerColles}
        disabled={desactive || nbColles === 0}
      >
        Comparer {nbColles > 0 ? `${nbColles} ` : ""}identifiant{nbColles > 1 ? "s" : ""}
      </button>
    </div>
  );
}
