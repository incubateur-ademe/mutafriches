import {
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
} from "../../enums";

/**
 * Données complémentaires saisies par l'utilisateur dans l'UI
 * Complète les données d'enrichissement automatique pour le calcul de mutabilité
 */
export interface DonneesComplementairesInputDto {
  // Propriété
  typeProprietaire: TypeProprietaire;

  // Infrastructure
  terrainViabilise: TerrainViabilise;
  etatBatiInfrastructure: EtatBatiInfrastructure;

  // Environnement
  presencePollution: PresencePollution;

  // Patrimoine et paysage
  valeurArchitecturaleHistorique: ValeurArchitecturale;
  qualitePaysage: QualitePaysage;

  // Accessibilité
  qualiteVoieDesserte: QualiteVoieDesserte;
}
