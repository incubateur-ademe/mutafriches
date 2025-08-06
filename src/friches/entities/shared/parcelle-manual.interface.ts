import {
  TypeProprietaire,
  EtatBati,
  PresencePollution,
  QualiteDesserte,
  QualitePaysage,
  ValeurArchitecturale,
  ReseauEaux,
} from '../../enums/parcelle.enums';

/**
 * Interface pour les données demandées manuellement à l'utilisateur
 * Ces données nécessitent une expertise locale ou une visite de terrain
 */
export interface ParcelleManualData {
  /**
   * Type de propriétaire
   * Nécessite une vérification manuelle car les données cadastrales peuvent être obsolètes
   */
  typeProprietaire?: TypeProprietaire;

  /**
   * Site connecté aux réseaux d'eau
   * Nécessite une vérification terrain
   */
  reseauEaux?: ReseauEaux;

  /**
   * État général du bâti et des infrastructures
   * Nécessite une évaluation visuelle sur site
   */
  etatBatiInfrastructure?: EtatBati;

  /**
   * Présence de pollution connue ou suspectée
   * Nécessite une expertise environnementale
   */
  presencePollution?: PresencePollution;

  /**
   * Valeur architecturale et/ou historique du site
   * Nécessite une expertise patrimoniale
   */
  valeurArchitecturaleHistorique?: ValeurArchitecturale;

  /**
   * Qualité du paysage environnant
   * Nécessite une évaluation subjective sur site
   */
  qualitePaysage?: QualitePaysage;

  /**
   * Qualité de la voie de desserte
   * Nécessite une évaluation terrain de l'accessibilité
   */
  qualiteVoieDesserte?: QualiteDesserte;
}
