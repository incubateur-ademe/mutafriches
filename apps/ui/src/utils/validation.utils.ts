/**
 * Vérifie si un identifiant de parcelle cadastrale est valide
 *
 * Format des identifiants cadastraux français :
 * - Code département : 2 ou 3 chiffres (01-95, 2A, 2B, 971-976)
 * - Code commune : 3 chiffres
 * - Préfixe : 0 à 3 caractères (chiffres ou lettres, optionnel)
 * - Section : 2 lettres majuscules
 * - Numéro de parcelle : 4 chiffres
 *
 * Exemples valides :
 * - 290124AD0338 : Finistère (29), commune 012, section AD, parcelle 0338
 * - 25056000HZ0346 : Doubs (25), commune 056, préfixe 000, section HZ, parcelle 0346
 * - 42182000AB0123 : Loire (42), commune 182, préfixe 000, section AB, parcelle 0123
 * - 2A00400AC0045 : Corse-du-Sud (2A), commune 004, section AC, parcelle 0045
 *
 * @param id Le numéro de parcelle au format cadastral
 * @returns true si l'identifiant est valide, false sinon
 */
export function isValidParcelId(id: string): boolean {
  // Regex pour le format cadastral français complet
  // Pattern : [Dept 2-3 car][Commune 3 chiffres][Préfixe 0-3 car][Section 2 lettres][Parcelle 4 chiffres]
  const patterns = [
    // Départements métropole (01-95) + commune + préfixe optionnel + section + parcelle
    /^[0-9]{2}[0-9]{3}[0-9A-Z]{0,3}[A-Z]{2}[0-9]{4}$/,
    // Départements DOM (971-976) + commune + préfixe optionnel + section + parcelle
    /^97[1-6][0-9]{3}[0-9A-Z]{0,3}[A-Z]{2}[0-9]{4}$/,
    // Corse (2A, 2B) + commune + préfixe optionnel + section + parcelle
    /^2[AB][0-9]{3}[0-9A-Z]{0,3}[A-Z]{2}[0-9]{4}$/,
  ];

  // Vérifier si l'identifiant correspond à l'un des patterns
  return patterns.some((pattern) => pattern.test(id));
}
