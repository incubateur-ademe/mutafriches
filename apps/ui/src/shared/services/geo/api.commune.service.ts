/**
 * Recherche de communes françaises par nom via l'API Découpage administratif (geo.api.gouv.fr).
 * Réutilisable (aucune dépendance carte).
 */

export interface CommuneSuggestion {
  /** Code INSEE */
  code: string;
  /** Nom de la commune */
  nom: string;
  /** Code postal principal (si disponible) */
  codesPostaux?: string[];
}

interface CommuneApiItem {
  code: string;
  nom: string;
  codesPostaux?: string[];
}

/**
 * Recherche des communes par nom (triées par population décroissante).
 * Retourne au plus `limit` suggestions ; tableau vide en cas d'erreur.
 */
export async function searchCommunes(nom: string, limit = 8): Promise<CommuneSuggestion[]> {
  const query = nom.trim();
  if (query.length < 2) return [];

  try {
    const url =
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}` +
      `&fields=code,nom,codesPostaux&boost=population&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as CommuneApiItem[];
    return data.map((item) => ({
      code: item.code,
      nom: item.nom,
      codesPostaux: item.codesPostaux,
    }));
  } catch {
    return [];
  }
}
