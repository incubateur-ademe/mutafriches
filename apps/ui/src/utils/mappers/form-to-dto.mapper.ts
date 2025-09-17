import {
  CalculerMutabiliteInputDto,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";

/**
 * Reconstruit la structure DTO depuis les données aplaties du formulaire
 */
export function buildCalculerMutabiliteFromFormData(
  formData: Record<string, any>,
): CalculerMutabiliteInputDto {
  const donneesEnrichies: EnrichissementOutputDto = {
    identifiantParcelle: formData.identifiantParcelle || "manual-001",
    commune: formData.commune || "Test",
    surfaceSite: formData.surfaceSite || 0,
    surfaceBati: formData.surfaceBati,
    ancienneActivite: formData.ancienneActivite,
    siteEnCentreVille: formData.siteEnCentreVille || false,
    distanceAutoroute: formData.distanceAutoroute || 0,
    distanceTransportCommun: formData.distanceTransportCommun || 0,
    proximiteCommercesServices: formData.proximiteCommercesServices || false,
    connectionReseauElectricite: formData.connectionReseauElectricite ?? true,
    distanceRaccordementElectrique: formData.distanceRaccordementElectrique || 0,
    tauxLogementsVacants: formData.tauxLogementsVacants || 0,
    presenceRisquesTechnologiques: formData.presenceRisquesTechnologiques || false,
    presenceRisquesNaturels: formData.presenceRisquesNaturels,
    zonageEnvironnemental: formData.zonageEnvironnemental,
    zonageReglementaire: formData.zonageReglementaire,
    zonagePatrimonial: formData.zonagePatrimonial,
    trameVerteEtBleue: formData.trameVerteEtBleue,
    coordonnees: formData.coordonnees,
    sourcesUtilisees: ["Manual"],
    champsManquants: [],
    fiabilite: 10,
  };

  const donneesComplementaires: DonneesComplementairesInputDto = {
    typeProprietaire: formData.typeProprietaire || "ne-sait-pas",
    terrainViabilise: formData.terrainViabilise || "ne-sait-pas",
    etatBatiInfrastructure: formData.etatBatiInfrastructure || "ne-sait-pas",
    presencePollution: formData.presencePollution || "ne-sait-pas",
    valeurArchitecturaleHistorique: formData.valeurArchitecturaleHistorique || "ne-sait-pas",
    qualitePaysage: formData.qualitePaysage || "ne-sait-pas",
    qualiteVoieDesserte: formData.qualiteVoieDesserte || "ne-sait-pas",
  };

  return {
    donneesEnrichies,
    donneesComplementaires,
  };
}

/**
 * Aplatit la structure DTO pour l'affichage dans le formulaire
 */
export function flattenCalculerMutabiliteForForm(
  dto: CalculerMutabiliteInputDto,
): Record<string, any> {
  return {
    ...dto.donneesEnrichies,
    ...dto.donneesComplementaires,
  };
}
