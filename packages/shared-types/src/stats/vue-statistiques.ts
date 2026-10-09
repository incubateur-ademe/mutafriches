// Vues de la page statistiques publique (onglets du dashboard Metabase)
export const VUES_STATISTIQUES = ["usage", "matrice"] as const;

export type VueStatistiques = (typeof VUES_STATISTIQUES)[number];

export function isVueStatistiques(valeur: unknown): valeur is VueStatistiques {
  return VUES_STATISTIQUES.includes(valeur as VueStatistiques);
}
