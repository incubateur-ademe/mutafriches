import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";

/**
 * Entité métier Evaluation
 * Représente une évaluation de mutabilité sauvegardée pour une parcelle à un instant donné
 */
export class Evaluation {
  id?: string;
  parcelleId: string;
  dateCalcul: Date;

  // Snapshot des données au moment du calcul
  donneesEnrichissement: EnrichissementOutputDto;
  donneesComplementaires: DonneesComplementairesInputDto;

  // Résultats
  resultats: MutabiliteOutputDto;

  // Métadonnées
  versionAlgorithme: string;

  constructor(
    parcelleId: string,
    donneesEnrichissement: EnrichissementOutputDto,
    donneesComplementaires: DonneesComplementairesInputDto,
    resultats: MutabiliteOutputDto,
  ) {
    this.parcelleId = parcelleId;
    this.dateCalcul = new Date();
    this.donneesEnrichissement = donneesEnrichissement;
    this.donneesComplementaires = donneesComplementaires;
    this.resultats = resultats;
    this.versionAlgorithme = "1.0.0"; // TODO: Récupérer depuis config
  }

  /**
   * Retourne un résumé de l'évaluation
   */
  getResume(): string {
    const meilleurUsage = this.resultats.resultats.find((r) => r.rang === 7);
    return `Évaluation du ${this.dateCalcul.toLocaleDateString()} - ${meilleurUsage?.usage || "N/A"} (${meilleurUsage?.indiceMutabilite || 0}%)`;
  }
}
