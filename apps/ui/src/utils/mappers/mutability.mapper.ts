import {
  CalculerMutabiliteInputDto,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
} from "@mutafriches/shared-types";

export function buildMutabilityInput(
  enrichmentData: EnrichissementOutputDto,
  manualData: Record<string, string>,
): CalculerMutabiliteInputDto {
  // Mapper proprement les données manuelles
  const donneesComplementaires: DonneesComplementairesInputDto = {
    typeProprietaire: (manualData.typeProprietaire ||
      TypeProprietaire.NE_SAIT_PAS) as TypeProprietaire,
    terrainViabilise: (manualData.terrainViabilise ||
      TerrainViabilise.NE_SAIT_PAS) as TerrainViabilise,
    etatBatiInfrastructure: (manualData.etatBatiInfrastructure ||
      EtatBatiInfrastructure.NE_SAIT_PAS) as EtatBatiInfrastructure,
    presencePollution: (manualData.presencePollution ||
      PresencePollution.NE_SAIT_PAS) as PresencePollution,
    valeurArchitecturaleHistorique: (manualData.valeurArchitecturaleHistorique ||
      ValeurArchitecturale.NE_SAIT_PAS) as ValeurArchitecturale,
    qualitePaysage: (manualData.qualitePaysage || QualitePaysage.NE_SAIT_PAS) as QualitePaysage,
    qualiteVoieDesserte: (manualData.qualiteVoieDesserte ||
      QualiteVoieDesserte.NE_SAIT_PAS) as QualiteVoieDesserte,
  };

  return {
    donneesEnrichies: enrichmentData,
    donneesComplementaires,
  };
}
