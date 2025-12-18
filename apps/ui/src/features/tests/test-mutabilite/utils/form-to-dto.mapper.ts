import {
  CalculerMutabiliteInputDto,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
} from "@mutafriches/shared-types";

/**
 * Convertit les données du formulaire en DTO pour le calcul de mutabilité
 * Utilisé quand l'utilisateur saisit manuellement les données (mode manuel)
 */
export function buildCalculerMutabiliteFromFormData(formData: any): CalculerMutabiliteInputDto {
  // Construction des données enrichies
  const donneesEnrichies: EnrichissementOutputDto = {
    // Identifiants
    identifiantParcelle: formData.identifiantParcelle || "manual-input",
    codeInsee: formData.codeInsee || "Non renseigné",
    commune: formData.commune || "Non renseigné",

    // Surfaces
    surfaceSite: formData.surfaceSite || 0,
    surfaceBati: formData.surfaceBati,

    // Localisation et accessibilité
    siteEnCentreVille: formData.siteEnCentreVille || false,
    distanceAutoroute: formData.distanceAutoroute || 5,
    distanceTransportCommun: formData.distanceTransportCommun || 500,
    proximiteCommercesServices: formData.proximiteCommercesServices || false,

    // Infrastructure électrique
    distanceRaccordementElectrique: formData.distanceRaccordementElectrique || 1,

    // Contexte urbain
    tauxLogementsVacants: formData.tauxLogementsVacants || 5,

    // Risques
    presenceRisquesTechnologiques: formData.presenceRisquesTechnologiques || false,
    presenceRisquesNaturels: formData.presenceRisquesNaturels,

    // Zonages
    zonageReglementaire: formData.zonageReglementaire,
    zonageEnvironnemental: formData.zonageEnvironnemental,
    zonagePatrimonial: formData.zonagePatrimonial,

    // Autres
    coordonnees: formData.coordonnees,

    // Métadonnées
    sourcesUtilisees: ["Saisie manuelle"],
    champsManquants: getFieldsMissing(formData),
    sourcesEchouees: [],
  };

  // Construction des données complémentaires
  const donneesComplementaires: DonneesComplementairesInputDto = {
    typeProprietaire: formData.typeProprietaire || "NE_SAIT_PAS",
    raccordementEau: formData.raccordementEau || "NE_SAIT_PAS",
    etatBatiInfrastructure: formData.etatBatiInfrastructure || "NE_SAIT_PAS",
    presencePollution: formData.presencePollution || "NE_SAIT_PAS",
    valeurArchitecturaleHistorique: formData.valeurArchitecturaleHistorique || "NE_SAIT_PAS",
    qualitePaysage: formData.qualitePaysage || "NE_SAIT_PAS",
    qualiteVoieDesserte: formData.qualiteVoieDesserte || "NE_SAIT_PAS",
    trameVerteEtBleue: formData.trameVerteEtBleue || "NE_SAIT_PAS",
  };

  return {
    donneesEnrichies,
    donneesComplementaires,
  };
}

/**
 * Identifie les champs manquants dans les données du formulaire
 */
function getFieldsMissing(formData: any): string[] {
  const requiredFields = [
    "identifiantParcelle",
    "commune",
    "surfaceSite",
    "typeProprietaire",
    "siteEnCentreVille",
    "distanceAutoroute",
    "distanceTransportCommun",
    "proximiteCommercesServices",
    "tauxLogementsVacants",
    "presenceRisquesTechnologiques",
    "presenceRisquesNaturels",
    "zonageReglementaire",
    "raccordementEau",
    "etatBatiInfrastructure",
    "presencePollution",
    "valeurArchitecturaleHistorique",
    "qualitePaysage",
    "qualiteVoieDesserte",
    "trameVerteEtBleue",
  ];

  const missing: string[] = [];
  for (const field of requiredFields) {
    if (!formData[field] || formData[field] === "" || formData[field] === "NE_SAIT_PAS") {
      missing.push(field);
    }
  }

  return missing;
}
