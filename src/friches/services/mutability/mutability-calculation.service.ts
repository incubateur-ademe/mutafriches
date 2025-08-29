import { Injectable } from '@nestjs/common';
import { MutabilityInputDto } from 'src/friches/dto/mutability-input.dto';
import { MutabilityResultDto } from 'src/friches/dto/mutability-result.dto';
import { UsageType } from 'src/friches/enums/mutability.enums';
import {
  MATRICE_SCORING,
  POIDS_CRITERES,
  ScoreParUsage,
} from './config/criteres-scoring.config';

interface ResultatMutabiliteUsage {
  usage: UsageType;
  indice: number;
  avantages: number;
  contraintes: number;
}

@Injectable()
export class MutabilityCalculationService {
  /**
   * Calcule la mutabilité d'une parcelle pour différents types d'usage
   * @param input Les critères d'entrée pour le calcul de mutabilité
   * @returns  Le résultat du calcul de mutabilité pour chaque type d'usage
   */
  calculateMutability(input: MutabilityInputDto): MutabilityResultDto {
    const usages = Object.values(UsageType);

    // Pour chaque usage, calculer son score
    const resultats = usages.map((usage) =>
      this.calculerIndiceMutabilite(input, usage),
    );

    // Trier par indice décroissant et transformer en UsageResultDto
    const resultatsTries = resultats.sort((a, b) => b.indice - a.indice);

    // Mapper vers UsageResultDto
    const usageResultats = resultatsTries.map((r, index) => ({
      usage: r.usage,
      rang: index + 1,
      indiceMutabilite: r.indice,
      avantages: r.avantages,
      contraintes: r.contraintes,
    }));

    return {
      resultats: usageResultats,
      // TODO: Calcul réel de la fiabilité
      fiabilite: {
        note: 8.5,
        text: 'Fiable',
        description: 'Données analysées avec un niveau de confiance élevé.',
      },
    };
  }

  /**
   * Calcule l'indice de mutabilité pour un usage spécifique
   * @param input Les critères d'entrée
   * @param usage Le type d'usage pour lequel calculer l'indice
   * @returns Le résultat complet incluant l'indice, les avantages et contraintes
   */
  private calculerIndiceMutabilite(
    input: MutabilityInputDto,
    usage: UsageType,
  ): ResultatMutabiliteUsage {
    // Etape 1: Calculer avantages et contraintes
    const { avantages, contraintes } = this.calculerScorePourUsage(
      input,
      usage,
    );

    // Etape 2: Calculer l'indice de mutabilité
    const indice =
      avantages + contraintes === 0
        ? 0
        : Math.round((avantages / (avantages + contraintes)) * 1000) / 10;

    return { usage, indice, avantages, contraintes };
  }

  /**
   * Calcule les scores d'avantages et de contraintes pour un usage donné
   * @param input Les critères d'entrée
   * @param usage Le type d'usage pour lequel calculer le score
   * @returns Les totaux d'avantages et de contraintes pour cet usage
   */
  private calculerScorePourUsage(
    input: MutabilityInputDto,
    usage: keyof ScoreParUsage,
  ): { avantages: number; contraintes: number } {
    let avantages = 0;
    let contraintes = 0;

    // Pour chaque critère dans l'input
    Object.entries(input).forEach(([champDTO, valeur]) => {
      // Ignorer si null/undefined
      if (valeur === null || valeur === undefined) return;

      // Obtenir le score pour ce critère
      const score = this.obtenirScoreCritere(champDTO, valeur, usage);
      if (score === null) return;

      // Appliquer le poids
      const poids =
        POIDS_CRITERES[champDTO as keyof typeof POIDS_CRITERES] ?? 1;
      const pointsPonderes = score * poids;

      // Séparer avantages et contraintes
      if (pointsPonderes >= 0) {
        avantages += pointsPonderes;
      } else {
        contraintes += Math.abs(pointsPonderes); // Valeur absolue pour contraintes
      }
    });

    return { avantages, contraintes };
  }

  /**
   * Obtient le score d'un critère spécifique pour un usage
   * @param champDTO Le nom du champ/critère
   * @param valeur La valeur du critère
   * @param usage Le type d'usage
   * @returns Le score ou null si non trouvé
   */
  private obtenirScoreCritere(
    champDTO: string,
    valeur: unknown,
    usage: keyof ScoreParUsage,
  ): number | null {
    const matriceCritere =
      MATRICE_SCORING[champDTO as keyof typeof MATRICE_SCORING];

    // Critère non mappé
    if (!matriceCritere) return null;

    // Si c'est une fonction (critères numériques)
    if (typeof matriceCritere === 'function') {
      const scoreResult = matriceCritere(valeur as number);
      return scoreResult[usage];
    }

    // Si c'est un objet (enums ou booléens)
    // Convertir la valeur en clé d'indexation appropriée
    const cleIndex = this.convertirEnCleIndex(valeur);
    const typedMatrice = matriceCritere as Record<
      string | number,
      ScoreParUsage
    >;
    const scores = typedMatrice[cleIndex] as ScoreParUsage | undefined;

    return scores ? scores[usage] : null;
  }

  /**
   * Convertit une valeur en clé d'indexation pour les objets
   * @param valeur La valeur à convertir
   * @returns La clé d'indexation
   */
  private convertirEnCleIndex(valeur: unknown): string | number {
    if (typeof valeur === 'boolean') {
      return String(valeur); // "true" ou "false"
    }
    if (typeof valeur === 'number') {
      return valeur;
    }
    return String(valeur); // Pour les strings et autres
  }
}
