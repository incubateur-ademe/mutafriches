/**
 * Valide le format d'un identifiant parcellaire
 */
export const isValidParcelId = (identifiant: string): boolean => {
  // Format attendu: 8 chiffres, 2 lettres/numéros, 4 chiffres
  // TODO : Vérifier si le format est conforme aux spécifications du cadastre
  return parcelIdRegex.test(identifiant);
};

export const parcelIdRegex = /^\d{8}[A-Z0-9]{2}\d{4}$/;
