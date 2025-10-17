import { AddressSuggestion, GeocodingApiResponse } from "./api.geocoding.types";

const GEOCODING_API_URL = "https://data.geopf.fr/geocodage";

/**
 * Recherche d'adresses avec auto-complétion via l'API Géoplateforme
 */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: "10",
    autocomplete: "1",
    index: "address",
  });

  try {
    const response = await fetch(`${GEOCODING_API_URL}/search?${params.toString()}`);

    if (!response.ok) {
      console.error("Erreur API Géocodage:", response.status);
      return [];
    }

    const data = (await response.json()) as GeocodingApiResponse;

    return data.features.map((feature) => ({
      label: feature.properties.label,
      coordinates: feature.geometry.coordinates,
      city: feature.properties.city || "",
      postcode: feature.properties.postcode || "",
    }));
  } catch (error) {
    console.error("Erreur recherche adresse:", error);
    return [];
  }
}
