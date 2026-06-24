/**
 * Extrait le code département depuis un identifiant cadastral (IDU).
 * Gère la métropole (2 chiffres), les DOM (97x, 3 chiffres) et la Corse (2A/2B).
 *
 * @example
 * extraireDepartement("490070000A0123") // "49"
 * extraireDepartement("2A0040000B0045") // "2A"
 * extraireDepartement("9740120000C001") // "974"
 */
export function extraireDepartement(identifiant?: string): string {
  if (!identifiant || identifiant.length < 2) return "";
  if (/^97\d/.test(identifiant)) return identifiant.slice(0, 3);
  if (/^2[AB]/i.test(identifiant)) return identifiant.slice(0, 2).toUpperCase();
  return identifiant.slice(0, 2);
}
