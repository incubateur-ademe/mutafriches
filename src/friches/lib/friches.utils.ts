/**
 * Valide le format d'un identifiant parcellaire
 */
export const isValidParcelId = (identifiant: string): boolean => {
  // Format attendu: 8 chiffres, 2 lettres/numéros, 4 chiffres
  // TODO : Vérifier si le format est conforme aux spécifications du cadastre
  const pattern = /^\d{8}[A-Z0-9]{2}\d{4}$/;
  return pattern.test(identifiant);
};
