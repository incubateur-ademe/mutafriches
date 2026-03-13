/**
 * DTO pour une version de l'algorithme de mutabilité
 */
export interface AlgorithmeVersionDto {
  version: string;
  label: string;
  date: string;
}

/**
 * DTO pour le résultat d'une comparaison entre versions
 */
export type ComparaisonMutabiliteOutputDto = Record<
  string,
  import("./mutabilite-output.dto").MutabiliteOutputDto
>;
