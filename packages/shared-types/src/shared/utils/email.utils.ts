// Validation d'email partagée UI + API (longueur max RFC 5321 : 254 caractères)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_MAX_LENGTH = 254;

export function isValidEmail(value: unknown): boolean {
  return typeof value === "string" && value.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(value);
}
