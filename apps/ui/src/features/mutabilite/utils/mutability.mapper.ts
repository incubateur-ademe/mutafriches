import {
  CalculerMutabiliteInputDto,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";

export function buildMutabilityInput(
  enrichmentData: EnrichissementOutputDto,
  manualData: Record<string, string>,
): CalculerMutabiliteInputDto {
  // Mapper proprement les données manuelles
  const donneesComplementaires: DonneesComplementairesInputDto = {
    typeProprietaire: (manualData.typeProprietaire ||
      TypeProprietaire.NE_SAIT_PAS) as TypeProprietaire,
    raccordementEau: (manualData.raccordementEau || RaccordementEau.NE_SAIT_PAS) as RaccordementEau,
    etatBatiInfrastructure: (manualData.etatBatiInfrastructure ||
      EtatBatiInfrastructure.NE_SAIT_PAS) as EtatBatiInfrastructure,
    presencePollution: (manualData.presencePollution ||
      PresencePollution.NE_SAIT_PAS) as PresencePollution,
    valeurArchitecturaleHistorique: (manualData.valeurArchitecturaleHistorique ||
      ValeurArchitecturale.NE_SAIT_PAS) as ValeurArchitecturale,
    qualitePaysage: (manualData.qualitePaysage || QualitePaysage.NE_SAIT_PAS) as QualitePaysage,
    qualiteVoieDesserte: (manualData.qualiteVoieDesserte ||
      QualiteVoieDesserte.NE_SAIT_PAS) as QualiteVoieDesserte,
    tvb: (manualData.tvb || TrameVerteEtBleue.NE_SAIT_PAS) as TrameVerteEtBleue,
  };

  return {
    donneesEnrichies: enrichmentData,
    donneesComplementaires,
  };
}
