/**
 * Résolution d'un nom de commune en code INSEE via la BAN (api-adresse.data.gouv.fr),
 * déjà utilisée par le projet pour le reverse géocodage des sites partenaires.
 *
 * Utile pour les inventaires partenaires qui ne donnent que le libellé de la commune :
 * le code INSEE est le préalable à toute résolution d'IDU par attributs.
 */
const BAN_SEARCH_URL = "https://api-adresse.data.gouv.fr/search/";
const TIMEOUT_MS = 15000;

interface BanFeature {
  properties?: {
    citycode?: string;
    city?: string;
  };
}

export interface CommuneInsee {
  codeInsee: string;
  nom: string;
}

// Le code INSEE porte le département en préfixe (2 car., 3 en outre-mer, "2A"/"2B" en Corse).
function appartientAuDepartement(codeInsee: string, departement: string): boolean {
  return codeInsee.startsWith(departement);
}

/**
 * Résout le code INSEE d'une commune, restreint à un département pour lever les homonymies
 * (« Ardon » existe dans le Loiret et dans le Jura). Retourne null si aucune correspondance
 * univoque : l'appelant doit alors trancher à la main plutôt que deviner.
 */
export async function communeVersInsee(
  nomCommune: string,
  departement: string,
): Promise<CommuneInsee | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${BAN_SEARCH_URL}?q=${encodeURIComponent(nomCommune)}&type=municipality&limit=15`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = (await res.json()) as { features?: BanFeature[] };
    const candidats = (data.features ?? [])
      .map((f) => f.properties)
      .filter(
        (p): p is { citycode: string; city: string } =>
          typeof p?.citycode === "string" &&
          typeof p?.city === "string" &&
          appartientAuDepartement(p.citycode, departement),
      );

    // La BAN classe par pertinence : le premier candidat du bon département fait foi.
    const retenu = candidats[0];
    return retenu ? { codeInsee: retenu.citycode, nom: retenu.city } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
