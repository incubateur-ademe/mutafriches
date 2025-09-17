/**
 * Vérifie si un identifiant de parcelle est valide
 * @param id Le numéro de parcelle au format "123456789AB1234"
 * @returns
 */
export function isValidParcelId(id: string): boolean {
  return /^[0-9]{5}[0-9]{3}[A-Z]{2}[0-9]{4}$/.test(id);
}
