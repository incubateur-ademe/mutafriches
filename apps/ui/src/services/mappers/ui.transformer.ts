import { EnrichmentResultDto, UiParcelleDto } from "@mutafriches/shared-types";

/**
 * Transforme les données d'enrichissement brutes en format UI
 */
export const transformToUiData = (enrichmentData: EnrichmentResultDto): UiParcelleDto => {
  return {
    identifiantParcelle: enrichmentData.identifiantParcelle,
    commune: enrichmentData.commune || "Non renseignée",

    // Surfaces formatées
    surfaceParcelle: enrichmentData.surfaceSite
      ? `${enrichmentData.surfaceSite.toLocaleString("fr-FR")} m²`
      : "Non renseigné",
    surfaceBatie: enrichmentData.surfaceBati
      ? `${enrichmentData.surfaceBati.toLocaleString("fr-FR")} m²`
      : "Non renseigné",

    // Données électriques
    connectionElectricite: enrichmentData.connectionReseauElectricite ? "Oui" : "Non",
    distanceRaccordement: enrichmentData.distanceRaccordementElectrique
      ? `${enrichmentData.distanceRaccordementElectrique.toFixed(2)} m`
      : "Non renseigné",

    // Risques
    risquesNaturels: enrichmentData.presenceRisquesNaturels || "Non renseigné",

    // Champs non disponibles dans l'enrichissement actuel
    typeProprietaire: "Non renseigné",
    ancienneActivite: "Non renseigné",
    centreVille: "Non renseigné",
    distanceAutoroute: "Non renseigné",
    distanceTrain: "Non renseigné",
    proximiteCommerces: "Non renseigné",
    tauxLV: "Non renseigné",
    risquesTechno: "Non renseigné",
    zonageEnviro: "Non renseigné",
    zonageUrba: "Non renseigné",
    zonagePatrimonial: "Non renseigné",
    tvb: "Non renseigné",
    potentielEcologique: "À calculer",
  };
};
