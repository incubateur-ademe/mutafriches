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

/**
 * Code INSEE de commune : 5 chiffres, ou 2A/2B suivi de 3 chiffres en Corse. Les DOM
 * (971xx à 976xx) entrent dans le cas à 5 chiffres.
 */
export const CODE_INSEE_PATTERN = /^(?:\d{5}|2[AB]\d{3})$/;

// Retourne le code s'il est valide, sinon null (même contrat que sanitizeCommuneName).
export function sanitizeCodeInsee(code: string | null | undefined): string | null {
  return code && CODE_INSEE_PATTERN.test(code) ? code : null;
}

/** Code département : 2 chiffres, 3 en outre-mer, ou 2A/2B en Corse. */
export const CODE_DEPARTEMENT_PATTERN = /^(?:\d{2,3}|2[AB])$/;

export function sanitizeCodeDepartement(code: string | null | undefined): string | null {
  return code && CODE_DEPARTEMENT_PATTERN.test(code) ? code : null;
}
