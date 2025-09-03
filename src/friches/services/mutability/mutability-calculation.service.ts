import { Injectable } from '@nestjs/common';
import { MutabilityInputDto } from 'src/friches/dto/mutability-input.dto';
import { MutabilityResultDto } from 'src/friches/dto/mutability-result.dto';
import {
  DetailCritereDto,
  DetailCalculUsageDto,
} from 'src/friches/dto/detail-calcul.dto';
import { UsageType } from 'src/friches/enums/mutability.enums';
import {
  MATRICE_SCORING,
  NIVEAUX_FIABILITE,
  NOMBRE_CRITERES_MAPPES,
  POIDS_CRITERES,
  ScoreParUsage,
} from './config/criteres-scoring.config';

interface ResultatMutabiliteUsage {
  usage: UsageType;
  indice: number;
  avantages: number;
  contraintes: number;
  detailsCalcul?: DetailCalculUsageDto;
}

export interface MutabilityCalculationOptions {
  /** Active le mode détaillé avec tous les calculs intermédiaires */
  modeDetaille?: boolean;
}

@Injectable()
export class MutabilityCalculationService {
  /**
   * Calcule la mutabilité d'une parcelle pour différents types d'usage
   * @param input Les critères d'entrée pour le calcul de mutabilité
   * @param options Options pour le calcul (mode détaillé, etc.)
   * @returns Le résultat du calcul de mutabilité pour chaque type d'usage
   */
  calculateMutability(
    input: MutabilityInputDto,
    options: MutabilityCalculationOptions = {},
  ): MutabilityResultDto {
    const { modeDetaille = false } = options;

    // Calculer et trier les résultats par indice décroissant
    const resultats = Object.values(UsageType)
      .map((usage) => this.calculerIndiceMutabilite(input, usage, options))
      .sort((a, b) => b.indice - a.indice)
      .map((result, index) => ({
        usage: result.usage,
        rang: index + 1,
        indiceMutabilite: result.indice,
        avantages: result.avantages,
        contraintes: result.contraintes,
        ...(modeDetaille && result.detailsCalcul
          ? { detailsCalcul: result.detailsCalcul }
          : {}),
      }));

    const fiabilite = this.calculerFiabilite(input);

    // Ajouter le comptage des critères si mode détaillé
    if (modeDetaille) {
      const criteresRenseignes = Object.entries(input).filter(
        ([valeur]) =>
          valeur !== null && valeur !== undefined && valeur !== 'ne-sait-pas',
      ).length;

      fiabilite.criteresRenseignes = criteresRenseignes;
      fiabilite.criteresTotal = NOMBRE_CRITERES_MAPPES;
    }

    return {
      resultats,
      fiabilite,
    };
  }

  /**
   * Calcule l'indice de mutabilité pour un usage spécifique
   * @param input Les critères d'entrée
   * @param usage Le type d'usage pour lequel calculer l'indice
   * @param options Options de calcul
   * @returns Le résultat complet incluant l'indice, les avantages et contraintes
   */
  protected calculerIndiceMutabilite(
    input: MutabilityInputDto,
    usage: UsageType,
    options: MutabilityCalculationOptions = {},
  ): ResultatMutabiliteUsage {
    const { modeDetaille = false } = options;

    // Etape 1: Calculer avantages et contraintes
    const scoreData = modeDetaille
      ? this.calculerScorePourUsageDetaille(input, usage)
      : this.calculerScorePourUsage(input, usage);

    const { avantages, contraintes } = scoreData;

    // Etape 2: Calculer l'indice de mutabilité
    const indice =
      avantages + contraintes === 0
        ? 0
        : Math.round((avantages / (avantages + contraintes)) * 1000) / 10;

    const resultat: ResultatMutabiliteUsage = {
      usage,
      indice,
      avantages,
      contraintes,
    };

    // Ajouter les détails si mode détaillé
    if (modeDetaille && 'detailsAvantages' in scoreData) {
      resultat.detailsCalcul = {
        detailsAvantages: scoreData.detailsAvantages as DetailCritereDto[],
        detailsContraintes: scoreData.detailsContraintes as DetailCritereDto[],
        totalAvantages: avantages,
        totalContraintes: contraintes,
      };
    }

    return resultat;
  }

  /**
   * Calcule les scores d'avantages et de contraintes pour un usage donné
   * Version simple sans détails
   * @param input Les critères d'entrée
   * @param usage Le type d'usage pour lequel calculer le score
   * @returns Les totaux d'avantages et de contraintes pour cet usage
   */
  protected calculerScorePourUsage(
    input: MutabilityInputDto,
    usage: keyof ScoreParUsage,
  ): { avantages: number; contraintes: number } {
    let avantages = 0;
    let contraintes = 0;

    // Pour chaque critère dans l'input
    Object.entries(input).forEach(([champDTO, valeur]) => {
      // Ignorer si null/undefined
      if (valeur === null || valeur === undefined || valeur === 'ne-sait-pas')
        return;

      // TODO Debug a supprimer
      if (champDTO === 'nombreBatiments') return;

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
   * Calcule les scores avec détails pour un usage donné
   * Version détaillée avec traçabilité de chaque critère
   * @param input Les critères d'entrée
   * @param usage Le type d'usage pour lequel calculer le score
   * @returns Les totaux et le détail critère par critère
   */
  protected calculerScorePourUsageDetaille(
    input: MutabilityInputDto,
    usage: keyof ScoreParUsage,
  ): {
    avantages: number;
    contraintes: number;
    detailsAvantages: DetailCritereDto[];
    detailsContraintes: DetailCritereDto[];
  } {
    let avantages = 0;
    let contraintes = 0;
    const detailsAvantages: DetailCritereDto[] = [];
    const detailsContraintes: DetailCritereDto[] = [];

    Object.entries(input).forEach(([champDTO, valeur]) => {
      // Ignorer si null/undefined
      if (valeur === null || valeur === undefined || valeur === 'ne-sait-pas')
        return;

      const scoreBrut = this.obtenirScoreCritere(champDTO, valeur, usage);
      if (scoreBrut === null) return;

      const poids =
        POIDS_CRITERES[champDTO as keyof typeof POIDS_CRITERES] ?? 1;
      const scorePondere = scoreBrut * poids;

      const detail: DetailCritereDto = {
        critere: champDTO,
        valeur: valeur as string | number | boolean,
        scoreBrut,
        poids,
        scorePondere: Math.abs(scorePondere), // Toujours positif pour l'affichage
      };

      if (scorePondere >= 0) {
        avantages += scorePondere;
        detailsAvantages.push(detail);
      } else {
        contraintes += Math.abs(scorePondere);
        detailsContraintes.push(detail);
      }
    });

    // Trier par impact décroissant
    detailsAvantages.sort((a, b) => b.scorePondere - a.scorePondere);
    detailsContraintes.sort((a, b) => b.scorePondere - a.scorePondere);

    return { avantages, contraintes, detailsAvantages, detailsContraintes };
  }

  /**
   * Obtient le score d'un critère spécifique pour un usage
   * @param champDTO Le nom du champ/critère
   * @param valeur La valeur du critère
   * @param usage Le type d'usage
   * @returns Le score ou null si non trouvé
   */
  protected obtenirScoreCritere(
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
  protected convertirEnCleIndex(valeur: unknown): string | number {
    if (typeof valeur === 'boolean') {
      return String(valeur); // "true" ou "false"
    }
    if (typeof valeur === 'number') {
      return valeur;
    }
    return String(valeur); // Pour les strings et autres
  }

  /**
   * Calcule la fiabilité basée sur le nombre de critères renseignés
   * @param input Les critères d'entrée
   * @returns La fiabilité avec note, texte et description
   */
  protected calculerFiabilite(input: MutabilityInputDto): {
    note: number;
    text: string;
    description: string;
    criteresRenseignes?: number;
    criteresTotal?: number;
  } {
    // Compter les critères non null/undefined
    const criteresRenseignes = Object.entries(input).filter(
      ([valeur]) =>
        valeur !== null && valeur !== undefined && valeur !== 'ne-sait-pas',
    ).length;

    // Calculer le pourcentage sur le nombre de critères mappés
    const pourcentage = (criteresRenseignes / NOMBRE_CRITERES_MAPPES) * 100;

    // Note sur 10 arrondie à 0.5 près
    const note = Math.round((pourcentage / 10) * 2) / 2;

    // Déterminer le niveau de fiabilité
    const niveau = NIVEAUX_FIABILITE.find((n) => note >= n.seuilMin);

    // Retourner avec le niveau trouvé (toujours défini car on a un seuil à 0)
    return {
      note,
      text:
        niveau?.text || NIVEAUX_FIABILITE[NIVEAUX_FIABILITE.length - 1].text,
      description:
        niveau?.description ||
        NIVEAUX_FIABILITE[NIVEAUX_FIABILITE.length - 1].description,
    };
  }
}
