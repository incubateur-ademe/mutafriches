import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  MutabiliteOutputDto,
  OrigineUtilisation,
} from "@mutafriches/shared-types";
import { VERSION_ALGO } from "@mutafriches/shared-types";

/**
 * Entité métier Evaluation
 * Représente une évaluation de mutabilité sauvegardée pour une parcelle à un instant donné
 */
export class Evaluation {
  id?: string;
  codeInsee: string;
  parcelleId: string;
  dateCalcul: Date;

  // Snapshot des données au moment du calcul
  donneesEnrichissement: EnrichissementOutputDto;
  donneesComplementaires: DonneesComplementairesInputDto;

  // Résultats
  resultats: MutabiliteOutputDto;

  // Métadonnées
  origine: OrigineUtilisation;
  versionAlgorithme: string;

  constructor(
    parcelleId: string,
    codeInsee: string,
    donneesEnrichissement: EnrichissementOutputDto,
    donneesComplementaires: DonneesComplementairesInputDto,
    resultats: MutabiliteOutputDto,
    origine: OrigineUtilisation,
  ) {
    this.parcelleId = parcelleId;
    this.codeInsee = codeInsee;
    this.dateCalcul = new Date();
    this.donneesEnrichissement = donneesEnrichissement;
    this.donneesComplementaires = donneesComplementaires;
    this.resultats = resultats;
    this.origine = origine;
    this.versionAlgorithme = VERSION_ALGO;
  }

  /**
   * Retourne un résumé de l'évaluation
   */
  getResume(): string {
    const meilleurUsage = this.resultats.resultats.find((r) => r.rang === 7);
    return `Évaluation du ${this.dateCalcul.toLocaleDateString()} - ${meilleurUsage?.usage || "N/A"} (${meilleurUsage?.indiceMutabilite || 0}%)`;
  }
}
