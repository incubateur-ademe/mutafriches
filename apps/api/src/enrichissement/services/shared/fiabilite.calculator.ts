import { Injectable, Logger } from "@nestjs/common";

/**
 * Calculateur de fiabilité global de l'enrichissement
 *
 * Calcule un score de fiabilité sur 10 basé sur :
 * - Le nombre de sources utilisées
 * - Le nombre de champs manquants
 */
@Injectable()
export class FiabiliteCalculator {
  private readonly logger = new Logger(FiabiliteCalculator.name);

  /**
   * Calcule l'indice de fiabilité global
   *
   * @param sourcesCount - Nombre de sources utilisées avec succès
   * @param manquantsCount - Nombre de champs manquants
   * @returns Score de fiabilité entre 0 et 10
   */
  calculate(sourcesCount: number, manquantsCount: number): number {
    let fiabilite = 10;

    // Pénalité pour chaque champ manquant
    fiabilite -= manquantsCount * 0.3;

    // Pénalité si peu de sources (bonus si > 2 sources)
    fiabilite -= sourcesCount > 2 ? 0 : 2;

    // Arrondi à 1 décimale et borné entre 0 et 10
    const result = Math.max(0, Math.min(10, Math.round(fiabilite * 10) / 10));

    this.logger.debug(
      `Fiabilite calculee: ${result}/10 (sources: ${sourcesCount}, manquants: ${manquantsCount})`,
    );

    return result;
  }
}
