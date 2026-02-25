import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  MutabiliteOutputDto,
  OrigineUtilisation,
} from "@mutafriches/shared-types";
import { VERSION_ALGO } from "@mutafriches/shared-types";

/**
 * Entité métier Evaluation
 * Représente une évaluation de mutabilité sauvegardée pour un site (1 ou plusieurs parcelles) à un instant donné
 */
export class Evaluation {
  id?: string;
  codeInsee: string;
  siteId: string;
  nombreParcelles?: number;
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
    siteId: string,
    codeInsee: string,
    donneesEnrichissement: EnrichissementOutputDto,
    donneesComplementaires: DonneesComplementairesInputDto,
    resultats: MutabiliteOutputDto,
    origine: OrigineUtilisation,
    nombreParcelles?: number,
  ) {
    this.siteId = siteId;
    this.nombreParcelles = nombreParcelles;
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
    const meilleurUsage = this.resultats.resultats.find((r) => r.rang === 1);
    return `Évaluation du ${this.dateCalcul.toLocaleDateString()} - ${meilleurUsage?.usage || "N/A"} (${meilleurUsage?.indiceMutabilite || 0}%)`;
  }
}
