import { EnrichmentResultDto, MutabilityInputDto } from "@mutafriches/shared-types";

/**
 * Construit l'objet MutabilityInputDto à partir des données d'enrichissement et manuelles
 */
export const buildMutabilityInput = (
  enrichmentData: EnrichmentResultDto,
  manualData: Record<string, string>,
): MutabilityInputDto => {
  const input: MutabilityInputDto = {
    // ========= Données obligatoires =========
    identifiantParcelle: enrichmentData.identifiantParcelle,
    commune: enrichmentData.commune || "",
    surfaceSite: enrichmentData.surfaceSite || 0,

    // ========= Données d'enrichissement =========
    surfaceBati: enrichmentData.surfaceBati || 0,
    connectionReseauElectricite: enrichmentData.connectionReseauElectricite || false,
    distanceRaccordementElectrique: enrichmentData.distanceRaccordementElectrique || 0,
    presenceRisquesNaturels: enrichmentData.presenceRisquesNaturels || "ne-sait-pas",
    coordonnees: enrichmentData.coordonnees,
    fiabilite: enrichmentData.fiabilite || 5,

    // ========= Données manuelles du formulaire (pas de mapping, les enums utilisent déjà kebab-case) =========
    typeProprietaire: manualData.typeProprietaire || "ne-sait-pas",
    etatBatiInfrastructure: manualData.etatBati || "ne-sait-pas",
    presencePollution: manualData.presencePollution || "ne-sait-pas",
    qualiteVoieDesserte: manualData.qualiteDesserte || "ne-sait-pas",
    qualitePaysage: manualData.qualitePaysagere || "ne-sait-pas",
    valeurArchitecturaleHistorique: manualData.valeurArchitecturale || "ne-sait-pas",
    terrainViabilise: manualData.terrainViabilise || "ne-sait-pas",

    // ========= Données optionnelles (non demandées à l'utilisateur pour l'instant) =========
    // Ces champs pourraient venir d'enrichissement ou être ajoutés plus tard
    siteEnCentreVille: false, // TODO: récupérer depuis enrichissement
    distanceAutoroute: 0, // TODO: récupérer depuis enrichissement
    distanceTransportCommun: 0, // TODO: récupérer depuis enrichissement
    proximiteCommercesServices: false, // TODO: récupérer depuis enrichissement
    tauxLogementsVacants: 0, // TODO: récupérer depuis enrichissement
    presenceRisquesTechnologiques: false, // TODO: récupérer depuis enrichissement

    // Zonages (pourraient venir d'enrichissement futur)
    zonageEnvironnemental: "hors-zone",
    zonageReglementaire: "",
    zonagePatrimonial: "non-concerne",
    trameVerteEtBleue: "hors-trame",
  };

  return input;
};
