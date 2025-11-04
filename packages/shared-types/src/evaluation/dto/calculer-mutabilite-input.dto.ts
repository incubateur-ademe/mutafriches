import { EnrichissementOutputDto } from "../../enrichissement";
import { DonneesComplementairesInputDto } from "./donnees-complementaires-input.dto";

/**
 * Données d'entrée pour le calcul de mutabilité
 * Combine les données enrichies automatiquement et les données saisies manuellement
 */
export interface CalculerMutabiliteInputDto {
  /**
   * Données obtenues via l'enrichissement automatique
   */
  donneesEnrichies: EnrichissementOutputDto;

  /**
   * Données complémentaires saisies par l'utilisateur
   */
  donneesComplementaires: DonneesComplementairesInputDto;
}
