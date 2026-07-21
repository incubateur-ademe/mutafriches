/**
 * Feature flags UI pilotés par variables d'environnement Vite.
 * Permettent de masquer temporairement une fonctionnalité sans retirer le code.
 */

/**
 * Affiche la page de test « Comparaison Cartofriches ».
 * Masquée par défaut (route + carte dans /tests). Activable via
 * VITE_SHOW_COMPARAISON_CARTOFRICHES=true, et toujours visible en dev.
 */
export function isComparaisonCartofrichesEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_SHOW_COMPARAISON_CARTOFRICHES === "true") return true;
  return false;
}
