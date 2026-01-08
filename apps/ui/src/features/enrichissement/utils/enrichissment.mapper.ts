import { EnrichissementOutputDto, SourceEnrichissement } from "@mutafriches/shared-types";
import { ParcelleUiModel } from "../../../shared/types/parcelle.models";
import { formatDistance, formatSurface } from "../../../shared/utils/distance.formatter";

/**
 * Formate un booléen en "Oui" / "Non" ou chaîne vide si undefined
 */
const formatBoolean = (value: boolean | undefined): string => {
  if (value === undefined) return "";
  return value ? "Oui" : "Non";
};

/**
 * Détermine le message à afficher pour la distance au transport en commun
 */
const getDistanceTransportMessage = (enrichmentData: EnrichissementOutputDto): string => {
  const aucunArretMessage = "Aucun arrêt à moins de 2 km";

  // Si une distance est disponible, la formater
  if (enrichmentData.distanceTransportCommun !== undefined) {
    return formatDistance(enrichmentData.distanceTransportCommun);
  }

  // Si la source a échoué (erreur technique), retourner vide
  if (enrichmentData.sourcesEchouees?.includes(SourceEnrichissement.TRANSPORT_DATA_GOUV)) {
    return "";
  }

  // Si le champ est manquant mais la source n'a pas échoué = aucun arrêt trouvé dans le rayon
  if (enrichmentData.champsManquants?.includes("distanceTransportCommun")) {
    return aucunArretMessage;
  }

  // Cas par défaut
  return "";
};

/**
 * Transforme les données d'enrichissement brutes en format UI
 * Les valeurs vides ("") indiquent une donnée non accessible
 */
export const transformEnrichmentToUiData = (
  enrichmentData: EnrichissementOutputDto,
): ParcelleUiModel => {
  return {
    identifiantParcelle: enrichmentData.identifiantParcelle,
    commune: enrichmentData.commune || "",

    // Surfaces formatées
    surfaceParcelle: formatSurface(enrichmentData.surfaceSite),
    surfaceBatie: formatSurface(enrichmentData.surfaceBati),

    // Données électriques formatées
    distanceRaccordement: formatDistance(enrichmentData.distanceRaccordementElectrique),

    // Risques
    risquesNaturels: enrichmentData.presenceRisquesNaturels || "",
    risquesTechno: formatBoolean(enrichmentData.presenceRisquesTechnologiques),

    // Zonages
    zonageEnviro: enrichmentData.zonageEnvironnemental || "",
    zonageUrba: enrichmentData.zonageReglementaire || "",
    zonagePatrimonial: enrichmentData.zonagePatrimonial || "",

    // Transport
    centreVille: formatBoolean(enrichmentData.siteEnCentreVille),

    // Distance autoroute formatée
    distanceAutoroute: formatDistance(enrichmentData.distanceAutoroute),

    // Taux de logements vacants formaté
    tauxLV:
      enrichmentData.tauxLogementsVacants !== undefined
        ? `${enrichmentData.tauxLogementsVacants.toString()} %`
        : "",

    // Proximité commerces
    proximiteCommerces: formatBoolean(enrichmentData.proximiteCommercesServices),

    // Distance transports en commun formatée
    distanceTransportsEnCommun: getDistanceTransportMessage(enrichmentData),
  };
};
