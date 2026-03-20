import { useState, useCallback } from "react";
import type {
  CalculerMutabiliteInputDto,
  ComparaisonMutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { evaluationService } from "../../../shared/services/api/api.evaluation.service";

/**
 * Hook pour lancer une comparaison entre versions de l'algorithme
 */
export function useComparaisonAlgo() {
  const [resultats, setResultats] = useState<ComparaisonMutabiliteOutputDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comparer = useCallback(async (input: CalculerMutabiliteInputDto, versions: string[]) => {
    setIsLoading(true);
    setError(null);
    setResultats(null);

    try {
      const result = await evaluationService.comparerMutabilite(input, versions);
      setResultats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la comparaison");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reinitialiser = useCallback(() => {
    setResultats(null);
    setError(null);
  }, []);

  return { resultats, isLoading, error, comparer, reinitialiser };
}
