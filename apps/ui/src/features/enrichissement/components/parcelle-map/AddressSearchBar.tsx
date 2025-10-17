import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import {
  AddressSuggestion,
  searchAddresses,
} from "../../../../shared/services/geocoding/geocoding.service";

interface AddressSearchBarProps {
  onAddressSelected: (lat: number, lng: number) => void;
}

export function AddressSearchBar({ onAddressSelected }: AddressSearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [justSelected, setJustSelected] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
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
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length < 3 || justSelected) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      const results = await searchAddresses(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, justSelected]);

  // Fonction appelée lorsqu'une suggestion est sélectionnée
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    const [lng, lat] = suggestion.coordinates;

    setJustSelected(true);

    flushSync(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    });

    setQuery(suggestion.label);
    onAddressSelected(lat, lng);
  };

  const handleSearch = () => {
    if (suggestions.length > 0) {
      handleSelectAddress(suggestions[0]);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div className="fr-search-bar fr-search-bar--lg" role="search">
        <label className="fr-label" htmlFor="address-search-input">
          Rechercher une adresse
        </label>
        <input
          className="fr-input"
          aria-describedby="address-search-input-messages"
          placeholder="Ex: 13 Rue Henri Fouilleret, 77650 Longueville"
          id="address-search-input"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setJustSelected(false); // Reset justSelected
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          autoComplete="off"
        />
        <div className="fr-messages-group" id="address-search-input-messages" aria-live="polite">
          {isLoading && <p className="fr-message fr-message--info">Recherche en cours...</p>}
        </div>
        <button title="Rechercher" type="button" className="fr-btn" onClick={handleSearch}>
          Rechercher
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <fieldset
          className="fr-fieldset"
          id="address-suggestions"
          style={{
            marginTop: "1rem",
            border: "1px solid var(--border-default-grey)",
            borderRadius: "0.25rem",
            padding: "1rem",
            backgroundColor: "var(--background-default-grey)",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div key={index} className="fr-fieldset__element">
              <div className="fr-radio-group">
                <input
                  type="radio"
                  id={`address-radio-${index}`}
                  name="address-suggestions-group"
                  onChange={() => handleSelectAddress(suggestion)}
                />
                <label className="fr-label" htmlFor={`address-radio-${index}`}>
                  <span style={{ fontWeight: 500, display: "block" }}>{suggestion.label}</span>
                  {suggestion.city && (
                    <span className="fr-hint-text">
                      {suggestion.postcode} {suggestion.city}
                    </span>
                  )}
                </label>
              </div>
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}
