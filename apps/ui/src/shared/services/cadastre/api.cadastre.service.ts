import { squareBufferLngLat } from "../../utils/geo.utils";
import { ApiCartoFeatureCollection } from "./api.cadastre.types";

const API_BASE_URL = "https://apicarto.ign.fr/api/cadastre";

/**
 * Interroge l'API Carto IGN avec un point précis
 *
 * @param lng - Longitude WGS84
 * @param lat - Latitude WGS84
 * @returns FeatureCollection ou null si erreur
 */
export async function fetchParcelAtPoint(
  lng: number,
  lat: number,
): Promise<ApiCartoFeatureCollection | null> {
  const geom = {
    type: "Point" as const,
    coordinates: [lng, lat],
  };

  const params = new URLSearchParams();
  params.set("geom", JSON.stringify(geom));
  params.set("source_ign", "PCI");
  params.set("_limit", "1");

  const url = `${API_BASE_URL}/parcelle?${params.toString()}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const txt = await res.text();
      console.error("Erreur API Carto:", txt);
      return null;
    }

    const data = (await res.json()) as ApiCartoFeatureCollection;
    return data;
  } catch (error) {
    console.error("Erreur fetch parcelle:", error);
    return null;
  }
}

/**
 * Interroge l'API Carto IGN avec un buffer autour d'un point
 *
 * @param lng - Longitude WGS84
 * @param lat - Latitude WGS84
 * @param meters - Rayon du buffer en mètres
 * @returns FeatureCollection ou null si erreur
 */
export async function fetchParcelsAroundPoint(
  lng: number,
  lat: number,
  meters = 5,
): Promise<ApiCartoFeatureCollection | null> {
  const geom = squareBufferLngLat(lng, lat, meters);

  const params = new URLSearchParams();
  params.set("geom", JSON.stringify(geom));
  params.set("source_ign", "PCI");
  params.set("_limit", "5");

  const url = `${API_BASE_URL}/parcelle?${params.toString()}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const txt = await res.text();
      console.error("Erreur API Carto (buffer):", txt);
      return null;
    }

    const data = (await res.json()) as ApiCartoFeatureCollection;
    return data;
  } catch (error) {
    console.error("Erreur fetch parcelles (buffer):", error);
    return null;
  }
}

/**
 * Interroge l'API Carto IGN par référence cadastrale (code INSEE + section + numéro).
 * Utilisé pour le diagnostic d'un IDU (sans coordonnées).
 *
 * @returns FeatureCollection (0 feature si la parcelle n'existe pas dans le cadastre actuel)
 */
export async function fetchParcelByRef(
  codeInsee: string,
  section: string,
  numero: string,
): Promise<ApiCartoFeatureCollection | null> {
  const params = new URLSearchParams();
  params.set("code_insee", codeInsee);
  params.set("section", section);
  params.set("numero", numero);
  params.set("_limit", "1");

  const url = `${API_BASE_URL}/parcelle?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Erreur API Carto (ref):", await res.text());
      return null;
    }
    return (await res.json()) as ApiCartoFeatureCollection;
  } catch (error) {
    console.error("Erreur fetch parcelle (ref):", error);
    return null;
  }
}

/**
 * Récupère les parcelles d'une section (code INSEE + section).
 * Sert au diagnostic : déterminer si la section existe et lister les numéros présents.
 *
 * @param limit - Nombre maximum de parcelles renvoyées (défaut 200)
 */
export async function fetchSectionParcels(
  codeInsee: string,
  section: string,
  limit = 200,
): Promise<ApiCartoFeatureCollection | null> {
  const params = new URLSearchParams();
  params.set("code_insee", codeInsee);
  params.set("section", section);
  params.set("_limit", String(limit));

  const url = `${API_BASE_URL}/parcelle?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Erreur API Carto (section):", await res.text());
      return null;
    }
    return (await res.json()) as ApiCartoFeatureCollection;
  } catch (error) {
    console.error("Erreur fetch parcelles (section):", error);
    return null;
  }
}

/**
 * Recherche une parcelle avec stratégie de fallback
 * (point exact -> buffer 5m -> buffer 10m)
 *
 * @param lng - Longitude WGS84
 * @param lat - Latitude WGS84
 * @returns FeatureCollection ou null si aucune parcelle trouvée
 */
export async function searchParcelWithFallback(
  lng: number,
  lat: number,
): Promise<ApiCartoFeatureCollection | null> {
  // Tentative 1: Point exact
  let result = await fetchParcelAtPoint(lng, lat);

  if (result && result.features && result.features.length > 0) {
    return result;
  }

  // Tentative 2: Buffer 5m
  result = await fetchParcelsAroundPoint(lng, lat, 5);

  if (result && result.features && result.features.length > 0) {
    return result;
  }

  // Tentative 3: Buffer 10m
  result = await fetchParcelsAroundPoint(lng, lat, 10);

  if (result && result.features && result.features.length > 0) {
    return result;
  }

  return null;
}
