import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { searchCommunes, type CommuneSuggestion } from "@shared/services/geo/api.commune.service";

interface CommuneSearchInputProps {
  onCommuneSelected: (commune: CommuneSuggestion) => void;
  desactive?: boolean;
}

/**
 * Champ de recherche d'une commune par nom (autocomplétion via geo.api.gouv.fr).
 * Calqué sur AddressSearchBar (debounce manuel + fermeture au clic extérieur).
 */
export function CommuneSearchInput({ onCommuneSelected, desactive }: CommuneSearchInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CommuneSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();

    // Mise à jour d'état différée (jamais synchrone dans le corps de l'effet)
    debounceRef.current = window.setTimeout(async () => {
      if (q.length < 2 || justSelected) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const results = await searchCommunes(q);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, justSelected]);

  const handleSelect = (commune: CommuneSuggestion): void => {
    setJustSelected(true);
    flushSync(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    });
    setQuery(`${commune.nom} (${commune.code})`);
    onCommuneSelected(commune);
  };

  return (
    <div ref={wrapperRef}>
      <div className="fr-input-group">
        <label className="fr-label" htmlFor="cartofriches-commune-search">
          Commune
          <span className="fr-hint-text">Rechercher par nom (ex : Trélazé)</span>
        </label>
        <input
          id="cartofriches-commune-search"
          className="fr-input"
          type="search"
          autoComplete="off"
          placeholder="Nom de la commune"
          value={query}
          disabled={desactive}
          onChange={(e) => {
            setQuery(e.target.value);
            setJustSelected(false);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
      </div>

      {showSuggestions && suggestions.length > 0 ? (
        // Rendu dans le flux (pas en overlay absolu) : le conteneur DSFR .fr-tabs applique
        // overflow:hidden, ce qui clipperait une liste positionnée en absolute.
        <ul
          className="fr-p-1w fr-mt-1w"
          style={{
            listStyle: "none",
            margin: 0,
            border: "1px solid var(--border-default-grey)",
            borderRadius: "0.25rem",
            background: "var(--background-default-grey)",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((commune) => (
            <li key={commune.code}>
              <button
                type="button"
                className="fr-btn fr-btn--tertiary-no-outline"
                style={{ width: "100%", justifyContent: "flex-start" }}
                onClick={() => handleSelect(commune)}
              >
                {commune.nom}
                <span className="fr-hint-text fr-ml-1w">{commune.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
