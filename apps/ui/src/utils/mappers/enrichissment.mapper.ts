import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { UiParcelleDto } from "../../types/ui.types";

/**
 * Transforme les données d'enrichissement brutes en format UI
 */
export const transformEnrichmentToUiData = (
  enrichmentData: EnrichissementOutputDto,
): UiParcelleDto => {
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

    // Champs non disponibles dans l'enrichissement actuel
    typeProprietaire: nonAccessibleVersion,
    centreVille: nonAccessibleVersion,
    distanceAutoroute: nonAccessibleVersion,
    distanceTrain: nonAccessibleVersion,
    proximiteCommerces: nonAccessibleVersion,
    tauxLV: nonAccessibleVersion,
    risquesTechno: nonAccessibleVersion,
    zonageEnviro: nonAccessibleVersion,
    zonageUrba: nonAccessibleVersion,
    zonagePatrimonial: nonAccessibleVersion,
    tvb: nonAccessibleVersion,
    potentielEcologique: nonAccessibleVersion,
  };
};
