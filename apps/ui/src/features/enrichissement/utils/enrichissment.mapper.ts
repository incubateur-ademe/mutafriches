import { EnrichissementOutputDto, SourceEnrichissement } from "@mutafriches/shared-types";
import { ParcelleUiModel } from "../../../shared/types/parcelle.models";
import { formatDistance, formatSurface } from "../../../shared/utils/distance.formatter";

/**
 * Détermine le message à afficher pour la distance au transport en commun
 */
const getDistanceTransportMessage = (enrichmentData: EnrichissementOutputDto): string => {
  const nonAccessibleVersion = "Donnée non accessible";
  const aucunArretMessage = "Aucun arrêt à moins de 2 km";

  // Si une distance est disponible, la formater
  if (enrichmentData.distanceTransportCommun !== undefined) {
    return formatDistance(enrichmentData.distanceTransportCommun);
  }

  // Si la source a échoué (erreur technique), afficher "Donnée non accessible"
  if (enrichmentData.sourcesEchouees?.includes(SourceEnrichissement.TRANSPORT_DATA_GOUV)) {
    return nonAccessibleVersion;
  }

  // Si le champ est manquant mais la source n'a pas échoué = aucun arrêt trouvé dans le rayon
  if (enrichmentData.champsManquants?.includes("distanceTransportCommun")) {
    return aucunArretMessage;
  }

  // Cas par défaut
  return nonAccessibleVersion;
};

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

    // Proximité commerces
    proximiteCommerces:
      enrichmentData.proximiteCommercesServices !== undefined
        ? enrichmentData.proximiteCommercesServices
          ? "Oui"
          : "Non"
        : nonAccessibleVersion,

    // Distance transports en commun formatée
    distanceTransportsEnCommun: getDistanceTransportMessage(enrichmentData),
  };
};
