const GEOCODING_API_URL = "https://data.geopf.fr/geocodage";

export interface AddressSuggestion {
  label: string;
  coordinates: [number, number]; // [lng, lat]
  city: string;
  postcode: string;
}

interface GeocodingApiFeature {
  type: "Feature";
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    label: string;
    city?: string;
    postcode?: string;
    score: number;
  };
}

interface GeocodingApiResponse {
  type: "FeatureCollection";
  features: GeocodingApiFeature[];
}

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
    index: "address", // Uniquement les adresses
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
