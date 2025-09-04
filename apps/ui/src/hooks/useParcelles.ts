import * as parcellesApi from "../services/api/api.parcelles";

/**
 * Hook React pour utiliser l'API parcelles
 * Retourne les fonctions API bindées
 */
export function useParcelles() {
  return {
    enrichir: parcellesApi.enrichirParcelle,
    calculerMutabilite: parcellesApi.calculerMutabilite,
    analyser: parcellesApi.analyserParcelle,
  };
}
