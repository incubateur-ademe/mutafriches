import { TrameVerteEtBleue } from "../../enrichissement";
import {
  EtatBatiInfrastructure,
  PresencePollution,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  TypeProprietaire,
  ValeurArchitecturale,
} from "../enums";

/**
 * Données complémentaires saisies par l'utilisateur dans l'UI
 * Complète les données d'enrichissement automatique pour le calcul de mutabilité
 */
export interface DonneesComplementairesInputDto {
  // Propriété
  typeProprietaire: TypeProprietaire;

  // Infrastructure
  raccordementEau: RaccordementEau;
  etatBatiInfrastructure: EtatBatiInfrastructure;

  // Environnement
  presencePollution: PresencePollution;

  // Patrimoine et paysage
  valeurArchitecturaleHistorique: ValeurArchitecturale;
  qualitePaysage: QualitePaysage;

  // Accessibilité
  qualiteVoieDesserte: QualiteVoieDesserte;

  // Trame verte et bleue
  tvb: TrameVerteEtBleue;
}
