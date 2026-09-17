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
