/**
 * Validation d'un nom de commune (INSEE / cadastre) destiné à être affiché ou écrit dans des
 * fichiers générés. Restreint à un jeu de caractères sûr — lettres (accents inclus), chiffres,
 * espaces, apostrophes, tirets, parenthèses et points — afin d'éviter toute injection lorsque la
 * valeur provient d'une source externe (API cadastre).
 */
export const COMMUNE_NAME_PATTERN = /^[A-Za-zÀ-ÿ0-9 '’()\-.]{1,80}$/;

export function isValidCommuneName(name: string): boolean {
  return COMMUNE_NAME_PATTERN.test(name);
}

// Retourne le nom si valide, sinon null (même contrat que sanitizeParcelIdForApi).
export function sanitizeCommuneName(name: string | null | undefined): string | null {
  return name && COMMUNE_NAME_PATTERN.test(name) ? name : null;
}
