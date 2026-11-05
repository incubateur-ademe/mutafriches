/**
 * DTO pour le retour vers l'iframe parent
 * Structure simplifiée contenant uniquement les informations essentielles
 */
export interface IframeEvaluationSummaryDto {
  // Identifiant unique de l'évaluation pour récupération via API
  evaluationId: string;

  // Identifiant cadastral du site (multi-parcelle : identifiants joints par virgules)
  identifiantParcelle: string;

  // Identifiants des parcelles analysées (un seul élément en mono-parcelle)
  identifiantsParcelles: string[];

  // Chemin de GET /evaluation/:id, absent si l'évaluation n'a pas d'identifiant
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
