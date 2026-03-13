import { useState, useEffect } from "react";
import type { AlgorithmeVersionDto } from "@mutafriches/shared-types";
import { evaluationService } from "../../../shared/services/api/api.evaluation.service";

/**
 * Hook pour récupérer les versions disponibles de l'algorithme
 */
export function useAlgorithmeVersions() {
  const [versions, setVersions] = useState<AlgorithmeVersionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const charger = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await evaluationService.getAlgorithmeVersions();
        if (!cancelled) {
          setVersions(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur lors du chargement des versions");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    charger();
    return () => {
      cancelled = true;
    };
  }, []);

  return { versions, isLoading, error };
}
