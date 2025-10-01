// apps/ui/src/components/step1/parcelle-selection-map/AddressSearchBar.tsx

import { useState, useEffect, useRef } from "react";
import { searchAddresses, AddressSuggestion } from "../../../services/geocoding/geocoding.service";

interface AddressSearchBarProps {
  onAddressSelected: (lat: number, lng: number) => void;
}

export function AddressSearchBar({ onAddressSelected }: AddressSearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche avec debounce (attendre 300ms après la dernière saisie)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchAddresses(query);
      setSuggestions(results);
      setShowSuggestions(true);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    const [lng, lat] = suggestion.coordinates;
    setQuery(suggestion.label);
    setShowSuggestions(false);
    onAddressSelected(lat, lng);
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
      <div className="fr-search-bar" role="search">
        <input
          className="fr-input"
          placeholder="Rechercher une adresse..."
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {isLoading && (
          <span style={{ position: "absolute", right: "10px", top: "10px" }}>Recherche...</span>
        )}
      </div>

      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            maxHeight: "300px",
            overflowY: "auto",
            listStyle: "none",
            margin: 0,
            padding: 0,
            zIndex: 1001,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: index < suggestions.length - 1 ? "1px solid #eee" : "none",
              }}
              onClick={() => handleSelectAddress(suggestion)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>{suggestion.label}</div>
              {suggestion.city && (
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {suggestion.postcode} {suggestion.city}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
