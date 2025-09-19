import { Injectable } from "@nestjs/common";
import {
  MutabiliteOutputDto,
  UsageType,
  UsageResultat,
  Fiabilite,
  DetailCalculUsage,
  DetailCritere,
  UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { Parcelle } from "../domain/entities/parcelle.entity";
import {
  MATRICE_SCORING,
  NIVEAUX_FIABILITE,
  NOMBRE_CRITERES_MAPPES,
  POIDS_CRITERES,
  ScoreParUsage,
} from "./config/criteres-scoring.config";

// Structure pour les calculs intermédiaires
interface CalculIntermediaire {
  usage: UsageType;
  indice: number;
  avantages: number;
  contraintes: number;
  detailsCalcul?: DetailCalculUsage;
}

// Options pour le calcul de mutabilité
export interface CalculOptions {
  modeDetaille?: boolean; // Inclure les détails des calculs
}

@Injectable()
export class CalculService {
  /**
   * Calcule la mutabilité d'une parcelle pour différents types d'usage
   */
  async calculer(parcelle: Parcelle, options: CalculOptions = {}): Promise<MutabiliteOutputDto> {
    const { modeDetaille = false } = options;

    // TODO : log a supprimer
    // eslint-disable-next-line no-console
    console.log("Calcul de la mutabilité pour la parcelle :", JSON.stringify(parcelle, null, 2));

    // Calculer et trier les résultats par indice décroissant
    const resultatsCalcules = Object.values(UsageType)
      .map((usage) => this.calculerIndiceMutabilite(parcelle, usage, options))
      .sort((a, b) => b.indice - a.indice);

    // Transformer en format de sortie avec rang
    const resultats: UsageResultat[] | UsageResultatDetaille[] = resultatsCalcules.map(
      (result, index) => {
        const base = {
          usage: result.usage,
          rang: index + 1,
          indiceMutabilite: result.indice,
          potentiel: this.determinerPotentiel(result.indice),
          explication: this.genererExplication(result.usage, result.indice),
        };

        // Si mode détaillé, ajouter les champs supplémentaires
        if (modeDetaille) {
          return {
            ...base,
            avantages: result.avantages,
            contraintes: result.contraintes,
            detailsCalcul: result.detailsCalcul,
          } as UsageResultatDetaille;
        }

        return base as UsageResultat;
      },
    );

    const fiabilite = this.calculerFiabilite(parcelle);

    return {
      fiabilite,
      resultats: resultats as UsageResultat[],
    };
  }

  /**
   * Calcule l'indice de mutabilité pour un usage spécifique
   */
  protected calculerIndiceMutabilite(
    parcelle: Parcelle,
    usage: UsageType,
    options: CalculOptions = {},
  ): CalculIntermediaire {
    const { modeDetaille = false } = options;

    // Etape 1: Calculer avantages et contraintes
    const scoreData = modeDetaille
      ? this.calculerScorePourUsageDetaille(parcelle, usage)
      : this.calculerScorePourUsage(parcelle, usage);

    const { avantages, contraintes } = scoreData;

    // Etape 2: Calculer l'indice de mutabilité
    const indice =
      avantages + contraintes === 0
        ? 0
        : Math.round((avantages / (avantages + contraintes)) * 1000) / 10;

    const resultat: CalculIntermediaire = {
      usage,
      indice,
      avantages,
      contraintes,
    };

    // Ajouter les détails si mode détaillé
    if (modeDetaille && "detailsAvantages" in scoreData) {
      const scoreDetaille = scoreData as {
        avantages: number;
        contraintes: number;
        detailsAvantages: DetailCritere[];
        detailsContraintes: DetailCritere[];
      };
      resultat.detailsCalcul = {
        detailsAvantages: scoreDetaille.detailsAvantages,
        detailsContraintes: scoreDetaille.detailsContraintes,
        totalAvantages: avantages,
        totalContraintes: contraintes,
      };
    }

    return resultat;
  }

  /**
   * Calcule les scores d'avantages et de contraintes pour un usage donné
   */
  protected calculerScorePourUsage(
    parcelle: Parcelle,
    usage: keyof ScoreParUsage,
  ): { avantages: number; contraintes: number } {
    let avantages = 0;
    let contraintes = 0;

    // Mapper les propriétés de la parcelle aux critères
    const criteres = this.extraireCriteres(parcelle);

    // Pour chaque critère
    Object.entries(criteres).forEach(([champDTO, valeur]) => {
      // Ignorer si null/undefined
      if (valeur === null || valeur === undefined || valeur === "ne-sait-pas") return;

      // Obtenir le score pour ce critère
      const score = this.obtenirScoreCritere(champDTO, valeur, usage);

      if (score === null) return;

      // Appliquer le poids
      const poids = POIDS_CRITERES[champDTO as keyof typeof POIDS_CRITERES] ?? 1;
      const pointsPonderes = score * poids;

      // Séparer avantages et contraintes
      if (pointsPonderes >= 0) {
        avantages += pointsPonderes;
      } else {
        contraintes += Math.abs(pointsPonderes);
      }
    });

    return { avantages, contraintes };
  }

  /**
   * Calcule les scores avec détails pour un usage donné
   */
  protected calculerScorePourUsageDetaille(
    parcelle: Parcelle,
    usage: keyof ScoreParUsage,
  ): {
    avantages: number;
    contraintes: number;
    detailsAvantages: DetailCritere[];
    detailsContraintes: DetailCritere[];
  } {
    let avantages = 0;
    let contraintes = 0;
    const detailsAvantages: DetailCritere[] = [];
    const detailsContraintes: DetailCritere[] = [];

    const criteres = this.extraireCriteres(parcelle);

    Object.entries(criteres).forEach(([champDTO, valeur]) => {
      // Ignorer si non renseigné
      if (valeur === null || valeur === undefined || valeur === "ne-sait-pas") return;

      const scoreBrut = this.obtenirScoreCritere(champDTO, valeur, usage);
      if (scoreBrut === null) return;

      const poids = POIDS_CRITERES[champDTO as keyof typeof POIDS_CRITERES] ?? 1;
      const scorePondere = scoreBrut * poids;

      const detail: DetailCritere = {
        critere: champDTO,
        valeur: valeur as string | number | boolean,
        scoreBrut,
        poids,
        scorePondere: Math.abs(scorePondere),
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
   * Extrait les critères de calcul depuis l'entité Parcelle
   */
  protected extraireCriteres(parcelle: Parcelle): Record<string, unknown> {
    // Mapper les propriétés de la parcelle vers les clés attendues par la matrice
    return {
      surfaceSite: parcelle.surfaceSite,
      surfaceBati: parcelle.surfaceBati,
      typeProprietaire: parcelle.typeProprietaire,
      terrainViabilise: parcelle.terrainViabilise,
      etatBatiInfrastructure: parcelle.etatBatiInfrastructure,
      presencePollution: parcelle.presencePollution,
      valeurArchitecturaleHistorique: parcelle.valeurArchitecturaleHistorique,
      qualitePaysage: parcelle.qualitePaysage,
      qualiteVoieDesserte: parcelle.qualiteVoieDesserte,
      siteEnCentreVille: parcelle.siteEnCentreVille,
      distanceAutoroute: parcelle.distanceAutoroute,
      distanceTransportCommun: parcelle.distanceTransportCommun,
      proximiteCommercesServices: parcelle.proximiteCommercesServices,
      connectionReseauElectricite: parcelle.connectionReseauElectricite,
      distanceRaccordementElectrique: parcelle.distanceRaccordementElectrique,
      tauxLogementsVacants: parcelle.tauxLogementsVacants,
      presenceRisquesTechnologiques: parcelle.presenceRisquesTechnologiques,
      presenceRisquesNaturels: parcelle.presenceRisquesNaturels,
      zonageEnvironnemental: parcelle.zonageEnvironnemental,
      zonageReglementaire: parcelle.zonageReglementaire,
      zonagePatrimonial: parcelle.zonagePatrimonial,
      trameVerteEtBleue: parcelle.trameVerteEtBleue,
    };
  }

  /**
   * Obtient le score d'un critère spécifique pour un usage
   */
  protected obtenirScoreCritere(
    champDTO: string,
    valeur: unknown,
    usage: keyof ScoreParUsage,
  ): number | null {
    const matriceCritere = MATRICE_SCORING[champDTO as keyof typeof MATRICE_SCORING];

    // Critère non mappé
    if (!matriceCritere) return null;

    // Si c'est une fonction (critères numériques)
    if (typeof matriceCritere === "function") {
      const scoreResult = matriceCritere(valeur as number);
      return scoreResult[usage];
    }

    // Si c'est un objet (enums ou booléens)
    const cleIndex = this.convertirEnCleIndex(valeur);
    const typedMatrice = matriceCritere as Record<string | number, ScoreParUsage>;
    const scores = typedMatrice[cleIndex];

    return scores ? scores[usage] : null;
  }

  /**
   * Convertit une valeur en clé d'indexation pour les objets
   */
  protected convertirEnCleIndex(valeur: unknown): string | number {
    if (typeof valeur === "boolean") {
      return String(valeur);
    }
    if (typeof valeur === "number") {
      return valeur;
    }
    return String(valeur);
  }

  /**
   * Calcule la fiabilité basée sur le nombre de critères renseignés
   */
  protected calculerFiabilite(parcelle: Parcelle): Fiabilite {
    const criteres = this.extraireCriteres(parcelle);


    console.log('critères  :>> ', critères );

    
    // Compter les critères non null/undefined
    const criteresRenseignes = Object.entries(criteres).filter(
      ([, valeur]) => valeur !== null && valeur !== undefined && valeur !== "ne-sait-pas",
    ).length;

    // Calculer le pourcentage sur le nombre de critères mappés
    const pourcentage = (criteresRenseignes / NOMBRE_CRITERES_MAPPES) * 100;

    // Note sur 10 arrondie à 0.5 près
    const note = Math.round((pourcentage / 10) * 2) / 2;

    // Déterminer le niveau de fiabilité
    const niveau = NIVEAUX_FIABILITE.find((n) => note >= n.seuilMin);

    return {
      note,
      text: niveau?.text || NIVEAUX_FIABILITE[NIVEAUX_FIABILITE.length - 1].text,
      description:
        niveau?.description || NIVEAUX_FIABILITE[NIVEAUX_FIABILITE.length - 1].description,
      criteresRenseignes,
      criteresTotal: NOMBRE_CRITERES_MAPPES,
    };
  }

  /**
   * Détermine le niveau de potentiel en fonction de l'indice
   */
  protected determinerPotentiel(indice: number): string {
    if (indice >= 70) return "Excellent";
    if (indice >= 60) return "Favorable";
    if (indice >= 50) return "Modéré";
    if (indice >= 40) return "Peu favorable";
    return "Défavorable";
  }

  /**
   * Génère une explication pour un usage
   */
  protected genererExplication(usage: UsageType, indice: number): string {
    // Générer une explication basique basée sur l'usage et l'indice
    const potentiel = this.determinerPotentiel(indice);
    return `Usage ${usage} avec un potentiel ${potentiel.toLowerCase()} (${indice}%)`;
  }
}
