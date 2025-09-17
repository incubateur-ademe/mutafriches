/**
 * DTO pour le retour vers l'iframe parent
 * Structure simplifiée contenant uniquement les informations essentielles
 */
export interface IframeEvaluationSummaryDto {
  // Identifiant unique de l'évaluation pour récupération via API
  evaluationId: string;

  // Identifiant cadastral de la parcelle analysée
  identifiantParcelle: string;

  // URL de récupération de l'évaluation complète
  retrieveUrl?: string;

  // Fiabilité de l'analyse (simplifié)
  fiabilite: {
    note: number;
    text: string;
  };

  // Usage principal recommandé (simplifié)
  usagePrincipal: {
    usage: string;
    indiceMutabilite: number;
    potentiel: string;
  };

  // Top 3 des usages (simplifié)
  top3Usages: Array<{
    usage: string;
    indiceMutabilite: number;
    rang: number;
  }>;

  // Métadonnées optionnelles
  metadata?: {
    dateAnalyse: string;
    versionAlgorithme?: string;
  };
}
