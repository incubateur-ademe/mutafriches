import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { ParcelleUiModel } from "../../../shared/types/parcelle.models";
import { formatDistance, formatSurface } from "../../../shared/utils/distance.formatter";

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
    surfaceParcelle: formatSurface(enrichmentData.surfaceSite),
    surfaceBatie: formatSurface(enrichmentData.surfaceBati),

    // Données électriques formatées
    distanceRaccordement: formatDistance(enrichmentData.distanceRaccordementElectrique),

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

    // Transport
    centreVille: enrichmentData.siteEnCentreVille
      ? "Oui"
      : enrichmentData.siteEnCentreVille === false
        ? "Non"
        : nonAccessibleVersion,

    // Distance autoroute formatée
    distanceAutoroute: formatDistance(enrichmentData.distanceAutoroute),

    // Taux de logements vacants formaté
    tauxLV:
      enrichmentData.tauxLogementsVacants !== undefined
        ? `${enrichmentData.tauxLogementsVacants.toString()} %`
        : nonAccessibleVersion,

    // Champs non disponibles dans l'enrichissement actuel
    typeProprietaire: nonAccessibleVersion,
    distanceTrain: nonAccessibleVersion,
    proximiteCommerces: nonAccessibleVersion,

    tvb: nonAccessibleVersion,
    potentielEcologique: nonAccessibleVersion,
  };
};
