import type { Logger } from "@nestjs/common";

/**
 * Normalisation des origines whitelistées (ALLOWED_ORIGINS, ALLOWED_INTEGRATOR_ORIGINS).
 *
 * Un header `Origin` ne porte jamais de slash final : sans normalisation, une entrée
 * configurée avec un slash ne matche jamais l'égalité stricte des guards et l'appelant
 * reçoit un 403 muet. La comparaison, elle, reste stricte (scheme + host + port) : c'est
 * elle qui protège des sous-domaines suffixes usurpés.
 */

// Retourne null pour une entrée vide, à écarter de la whitelist.
export function normaliserOrigine(valeur: string): string | null {
  const brute = valeur.trim().replace(/\/+$/, "");
  if (!brute) {
    return null;
  }

  try {
    // new URL normalise la casse du schéma et de l'hôte, ainsi que le port par défaut.
    // Une origine opaque (file:, data:) donne la chaîne "null" : on la rejette pour ne
    // pas autoriser par accident les requêtes portant `Origin: null`.
    const origineUrl = new URL(brute).origin;
    return origineUrl === "null" ? brute : origineUrl;
  } catch {
    // Valeur non parsable : on conserve la chaîne nettoyée, la comparaison stricte tranchera.
    return brute;
  }
}

// Le log expose les entrées réécrites : le symptôme d'origine était un rejet silencieux.
export function normaliserOrigines(valeurs: string[], logger?: Logger): string[] {
  return valeurs.reduce<string[]>((origines, valeur) => {
    const normalisee = normaliserOrigine(valeur);
    if (normalisee === null) {
      return origines;
    }

    if (normalisee !== valeur) {
      logger?.log(`Origine autorisée normalisée : "${valeur}" -> "${normalisee}"`);
    }

    origines.push(normalisee);
    return origines;
  }, []);
}

/** Origine locale : `localhost`, boucle locale ou IPv6 de boucle, quel que soit le port. */
const ORIGINE_LOCALE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/;

/**
 * Reconnaît une origine locale, quel que soit le port.
 *
 * En développement, le port du serveur Vite n'est pas garanti : il glisse sur 5174, 5175, etc.
 * dès que 5173 est pris. Figer l'origine autorisée sur un port fait alors échouer toutes les
 * requêtes par un blocage CORS côté navigateur — réponse servie normalement par l'API, mais
 * jetée par le navigateur, qui la remonte en « Failed to fetch ». Aucun log ne le signale.
 */
export function estOrigineLocale(origine?: string): boolean {
  if (!origine) {
    return false;
  }
  return ORIGINE_LOCALE.test(origine.trim());
}
