/**
 * Export centralisé de tous les enums
 */

// Enums pour l'enrichissement automatique
export {
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonageReglementaire,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from "./enrichissement.enums";

// Enums pour les données saisies par l'utilisateur
export {
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
} from "./saisie.enums";

// Enums pour les résultats de calcul
export { UsageType, UsageLabels } from "./usage.enums";
