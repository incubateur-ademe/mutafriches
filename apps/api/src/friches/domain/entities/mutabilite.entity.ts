import {
  MutabiliteOutputDto,
  UsageResultat,
  Fiabilite,
  UsageType,
} from "@mutafriches/shared-types";

/**
 * Entité métier Mutabilite
 * Représente le résultat d'un calcul de mutabilité pour une parcelle
 */
export class Mutabilite {
  fiabilite: Fiabilite;
  resultats: UsageResultat[];
  dateCalcul: Date;

  constructor(data: MutabiliteOutputDto) {
    this.fiabilite = data.fiabilite;
    this.resultats = data.resultats;
    this.dateCalcul = new Date();
  }

  /**
   * Retourne le meilleur usage (rang 7)
   */
  getMeilleurUsage(): UsageResultat | undefined {
    return this.resultats.find((r) => r.rang === 7);
  }

  /**
   * Retourne les usages favorables (indice >= 60)
   */
  getUsagesFavorables(): UsageResultat[] {
    return this.resultats.filter((r) => r.indiceMutabilite >= 60);
  }

  /**
   * Retourne l'usage par type
   */
  getUsageByType(type: UsageType): UsageResultat | undefined {
    return this.resultats.find((r) => r.usage === type);
  }

  /**
   * Vérifie si le calcul est fiable (note >= 7)
   */
  estFiable(): boolean {
    return this.fiabilite.note >= 7;
  }

  /**
   * Retourne un résumé textuel des résultats
   */
  getResume(): string {
    const meilleur = this.getMeilleurUsage();
    if (!meilleur) return "Aucun résultat disponible";

    return `Meilleur usage: ${meilleur.usage} (${meilleur.indiceMutabilite}%) - Fiabilité: ${this.fiabilite.note}/10`;
  }
}
