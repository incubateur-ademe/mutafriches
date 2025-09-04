// Export des enums
export {
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  TerrainViabilise,
  TypeUsage,
  UsageType, // Pour compatibilité
  PertinenceReponse,
  NiveauPotentiel,
  // Enums additionnels de l'API
  EtatBati,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZonageReglementaire,
  TrameVerteEtBleue,
  CouvertVegetal,
  PresenceEspeceProtegee,
  ZoneHumide,
  VoieEauProximite,
} from "./enums";

// Export des types de base
export type {
  Coordonnees,
  ParcelleBase,
  DonneesManuellesParcelle,
  ParcelleComplete,
} from "./parcelle.types";

// Export des DTOs
export type {
  ParcelleInputDto,
  EnrichmentResultDto,
  MutabilityInputDto,
  UsageResultDto,
  MutabilityResultDto,
  UiParcelleDto,
  UiEnrichmentResultDto,
  ManualFormDataDto,
  SaveDataResponseDto,
} from "./dto.types";
