import { FrichesCerema } from "@mutafriches/shared-types";

/**
 * Utilitaires de nettoyage des données brutes de l'API Cartofriches.
 *
 * L'API sérialise certains champs de façon non standard :
 * - `unite_fonciere_refcad` est une liste Python sérialisée en string (ex: "['49353000AC0628']")
 * - `proprio_type` / `proprio_nom` arrivent parfois éclatés caractère par caractère
 *   (ex: ['{', 'F', '6', 'c', '}']) à cause d'un bug de sérialisation des arrays Postgres.
 */

/**
 * Parse une référence cadastrale sérialisée en liste de parcelles normalisées.
 * Ex: "['49353000AC0628', '49353000AC0629']" -> ["49353000AC0628", "49353000AC0629"]
 */
export function parserRefcad(refcadBrut: string | null | undefined): string[] {
  if (!refcadBrut) return [];
  const matches = refcadBrut.match(/'([^']+)'|"([^"]+)"/g);
  if (matches) {
    return matches.map((m) => normaliserIdentifiant(m.replace(/['"]/g, "")));
  }
  // Pas de quotes : tenter un split simple sur séparateurs courants
  return refcadBrut
    .replace(/[[\]{}]/g, "")
    .split(/[,;]/)
    .map((s) => normaliserIdentifiant(s))
    .filter((s) => s.length > 0);
}

/**
 * Reconstitue un champ pouvant arriver éclaté caractère par caractère.
 * Ex: ['{', '"', 'P', 'O', ...] -> '{"PO..."}' -> "PO...".
 */
export function nettoyerChampArray(valeur: string[] | string | null | undefined): string | null {
  if (valeur === null || valeur === undefined) return null;

  let texte: string;
  if (Array.isArray(valeur)) {
    // Cas éclaté : tous les éléments sont des caractères isolés -> on rejoint
    const eclate = valeur.every((v) => typeof v === "string" && v.length <= 1);
    texte = eclate ? valeur.join("") : valeur.join(", ");
  } else {
    texte = valeur;
  }

  // Retirer la syntaxe d'array Postgres et les guillemets résiduels
  const nettoye = texte
    .replace(/^\{|\}$/g, "")
    .replace(/["']/g, "")
    .trim();

  return nettoye.length > 0 ? nettoye : null;
}

/** Normalise un identifiant cadastral pour comparaison (majuscules, sans espaces) */
export function normaliserIdentifiant(identifiant: string): string {
  return identifiant.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Applique le nettoyage des champs sérialisés sur une friche brute.
 */
export function nettoyerFriche(friche: FrichesCerema): FrichesCerema {
  return {
    ...friche,
    proprio_type: nettoyerChampArray(friche.proprio_type),
  };
}
