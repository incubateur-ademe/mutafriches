/**
 * Résolution d'un nom de commune en code INSEE via la BAN (api-adresse.data.gouv.fr),
 * déjà utilisée par le projet pour le reverse géocodage des sites partenaires.
 *
 * Utile pour les inventaires partenaires qui ne donnent que le libellé de la commune :
 * le code INSEE est le préalable à toute résolution d'IDU par attributs.
 *
 * Deux frontières sont validées ici (CodeQL js/http-to-file-access et son symétrique) :
 * l'entrée vient d'un fichier d'inventaire et part dans une URL ; la sortie vient du réseau
 * et finit dans une URL apicarto puis dans des fichiers générés.
 */
import {
  sanitizeCodeDepartement,
  sanitizeCodeInsee,
  sanitizeCommuneName,
} from "@mutafriches/shared-types";

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
 * (« Ardon » existe dans le Loiret et dans le Jura). Retourne null si l'entrée est malformée
 * ou si aucune correspondance n'est valide : l'appelant doit alors trancher à la main plutôt
 * que deviner.
 */
export async function communeVersInsee(
  nomCommune: string,
  departement: string,
): Promise<CommuneInsee | null> {
  // L'inventaire partenaire est une source externe : on refuse d'en faire une URL sans contrôle.
  const nomSur = sanitizeCommuneName(nomCommune);
  const departementSur = sanitizeCodeDepartement(departement);
  if (!nomSur || !departementSur) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${BAN_SEARCH_URL}?q=${encodeURIComponent(nomSur)}&type=municipality&limit=15`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = (await res.json()) as { features?: BanFeature[] };

    // La réponse repart en paramètre d'URL apicarto et dans les fichiers générés : chaque champ
    // est validé par un garde explicite avant d'être retenu. La BAN classant par pertinence, le
    // premier candidat valide du bon département fait foi.
    for (const feature of data.features ?? []) {
      const codeInsee = sanitizeCodeInsee(feature.properties?.citycode);
      if (!codeInsee) continue;

      const nom = sanitizeCommuneName(feature.properties?.city);
      if (!nom) continue;

      if (!appartientAuDepartement(codeInsee, departementSur)) continue;

      return { codeInsee, nom };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
