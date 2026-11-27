// Palier inférieur : « plus de N sites » doit rester vrai
export function arrondirAuPalier(valeur: number, palier: number): number {
  if (valeur <= 0 || palier <= 0) return 0;
  return Math.floor(valeur / palier) * palier;
}

export function formaterNombre(valeur: number): string {
  return valeur.toLocaleString("fr-FR");
}
