import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { ParcelleUiModel } from "../../../shared/types/parcelle.models";

/**
 * Transforme les données d'enrichissement brutes en format UI
 */
export const transformEnrichmentToUiData = (
  enrichmentData: EnrichissementOutputDto,
): ParcelleUiModel => {
  const nonAccessibleVersion = "Donnée non accessible";

  return {
    identifiantParcelle: enrichmentData.identifiantParcelle,
    commune: enrichmentData.commune || nonAccessibleVersion,

    // Surfaces formatées
    surfaceParcelle: enrichmentData.surfaceSite
      ? `${enrichmentData.surfaceSite.toLocaleString("fr-FR")} m²`
      : nonAccessibleVersion,
    surfaceBatie: enrichmentData.surfaceBati
      ? `${enrichmentData.surfaceBati.toLocaleString("fr-FR")} m²`
      : nonAccessibleVersion,

    // Données électriques
    distanceRaccordement: enrichmentData.distanceRaccordementElectrique
      ? `${enrichmentData.distanceRaccordementElectrique.toFixed(2)} m`
      : nonAccessibleVersion,

    // Risques
    risquesNaturels: enrichmentData.presenceRisquesNaturels || nonAccessibleVersion,
    risquesTechno:
      enrichmentData.presenceRisquesTechnologiques !== undefined
        ? enrichmentData.presenceRisquesTechnologiques
          ? "Oui"
          : "Non"
        : nonAccessibleVersion,

    // Zonages
    zonageEnviro: enrichmentData.zonageEnvironnemental || nonAccessibleVersion,
    zonageUrba: enrichmentData.zonageReglementaire || nonAccessibleVersion,
    zonagePatrimonial: enrichmentData.zonagePatrimonial || nonAccessibleVersion,

    // Champs non disponibles dans l'enrichissement actuel
    typeProprietaire: nonAccessibleVersion,
    centreVille: nonAccessibleVersion,
    distanceAutoroute: nonAccessibleVersion,
    distanceTrain: nonAccessibleVersion,
    proximiteCommerces: nonAccessibleVersion,
    tauxLV: nonAccessibleVersion,

    tvb: nonAccessibleVersion,
    potentielEcologique: nonAccessibleVersion,
  };
};
