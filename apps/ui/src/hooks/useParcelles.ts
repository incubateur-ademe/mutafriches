import { useState, useCallback, useTransition } from "react";
import * as parcellesApi from "../services/api/api.parcelles";
import {
  EnrichmentResultDto,
  MutabilityInputDto,
  MutabilityResultDto,
  UiParcelleDto,
} from "@mutafriches/shared-types";

/**
 * Hook React pour gérer l'état et les appels API des parcelles
 */
export function useParcelles() {
  // États pour l'enrichissement
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentResultDto | null>(null);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // États pour la mutabilité
  const [mutabilityData, setMutabilityData] = useState<MutabilityResultDto | null>(null);
  const [mutabilityError, setMutabilityError] = useState<string | null>(null);

  /**
   * Enrichir une parcelle avec gestion d'état
   */
  const enrichir = useCallback((identifiantParcelle: string) => {
    if (!identifiantParcelle?.trim()) {
      setEnrichmentError("Veuillez saisir un identifiant de parcelle");
      return;
    }

    setEnrichmentError(null);
    setEnrichmentData(null);

    startTransition(() => {
      parcellesApi
        .enrichirParcelle(identifiantParcelle)
        .then((result) => {
          setEnrichmentData(result);
          setEnrichmentError(null);
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Erreur lors de l'enrichissement";
          setEnrichmentError(errorMessage);
          setEnrichmentData(null);
          console.error("Erreur enrichissement:", error);
        });
    });
  }, []);

  /**
   * Calculer la mutabilité avec gestion d'état
   */
  const calculerMutabilite = useCallback((input: MutabilityInputDto) => {
    setMutabilityError(null);
    setMutabilityData(null);

    startTransition(() => {
      parcellesApi
        .calculerMutabilite(input)
        .then((result) => {
          setMutabilityData(result);
          setMutabilityError(null);
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Erreur lors du calcul de mutabilité";
          setMutabilityError(errorMessage);
          setMutabilityData(null);
          console.error("Erreur mutabilité:", error);
        });
    });
  }, []);

  /**
   * Workflow complet : enrichir puis calculer la mutabilité
   */
  const analyser = useCallback(
    (identifiantParcelle: string, donneesManuellesInput?: Partial<MutabilityInputDto>) => {
      setEnrichmentError(null);
      setMutabilityError(null);

      startTransition(() => {
        parcellesApi
          .analyserParcelle(identifiantParcelle, donneesManuellesInput)
          .then((result) => {
            setEnrichmentData(result.enrichment);
            setMutabilityData(result.mutability);
            setEnrichmentError(null);
            setMutabilityError(null);
          })
          .catch((error) => {
            const errorMessage =
              error instanceof Error ? error.message : "Erreur lors de l'analyse";
            setEnrichmentError(errorMessage);
            console.error("Erreur analyse:", error);
          });
      });
    },
    [],
  );

  /**
   * Convertir EnrichmentResultDto en UiParcelleDto pour l'affichage
   */
  const formatForDisplay = useCallback((data: EnrichmentResultDto | null): UiParcelleDto | null => {
    if (!data) return null;

    return {
      // Données de base
      surfaceParcelle: data.surfaceSite
        ? `${data.surfaceSite.toLocaleString("fr-FR")} m²`
        : "Non renseigné",
      surfaceBatie: data.surfaceBati
        ? `${data.surfaceBati.toLocaleString("fr-FR")} m²`
        : "Non renseigné",
      typeProprietaire: "Non renseigné", // Sera rempli après l'étape 2
      ancienneActivite: data.ancienneActivite || "Non renseigné",

      // Informations parcelle
      commune: data.commune || "Non renseigné",
      identifiantParcelle: data.identifiantParcelle,
      connectionElectricite: data.connectionReseauElectricite ? "Oui" : "Non",

      // Environnement
      centreVille: data.siteEnCentreVille ? "Oui" : "Non",
      distanceAutoroute: formatDistance(data.distanceAutoroute),
      distanceTrain: formatDistance(data.distanceTransportCommun),
      proximiteCommerces: data.proximiteCommercesServices ? "Oui" : "Non",
      distanceRaccordement: formatDistance(data.distanceRaccordementElectrique),
      tauxLV: data.tauxLogementsVacants ? `${data.tauxLogementsVacants}%` : "Non renseigné",

      // Risques et zonage
      risquesTechno: data.presenceRisquesTechnologiques ? "Oui" : "Non",
      risquesNaturels: data.presenceRisquesNaturels || "Non renseigné",
      zonageEnviro: data.zonageEnvironnemental || "Non renseigné",
      zonageUrba: data.zonageReglementaire || "Non renseigné",
      zonagePatrimonial: data.zonagePatrimonial || "Non renseigné",
      tvb: data.trameVerteEtBleue || "Non renseigné",
    };
  }, []);

  /**
   * Réinitialiser les états
   */
  const reset = useCallback(() => {
    setEnrichmentData(null);
    setEnrichmentError(null);
    setMutabilityData(null);
    setMutabilityError(null);
  }, []);

  return {
    // États
    enrichmentData,
    enrichmentError,
    mutabilityData,
    mutabilityError,
    isLoading: isPending,

    // Actions
    enrichir,
    calculerMutabilite,
    analyser,

    // Helpers
    formatForDisplay,
    reset,

    // État dérivé pour l'UI
    uiData: formatForDisplay(enrichmentData),
  };
}

/**
 * Helper pour formater les distances
 */
function formatDistance(distance?: number): string {
  if (!distance) return "Non renseigné";

  if (distance < 500) return "Moins de 500m";
  if (distance < 1000) return `${distance}m`;
  if (distance < 2000) return "Entre 1 et 2km";
  if (distance < 5000) return "Entre 2 et 5km";

  return `${(distance / 1000).toFixed(1)}km`;
}
