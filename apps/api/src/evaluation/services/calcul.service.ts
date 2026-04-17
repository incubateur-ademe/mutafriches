/* eslint-disable no-console */
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
import { RisqueNaturel } from "@mutafriches/shared-types";
import { Site } from "../entities/site.entity";
import { MATRICE_SCORING, POIDS_CRITERES } from "./algorithme/algorithme.config";
import { ScoreParUsage } from "./algorithme/algorithme.types";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { getAlgorithmeConfig } from "./algorithme/versions";

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
  versionAlgorithme?: string; // Version de l'algorithme (ex: "v1.0", "v1.1", "v1.2")
}

@Injectable()
export class CalculService {
  constructor(private readonly fiabiliteCalculator: FiabiliteCalculator) {}

  /**
   * Calcule la mutabilité d'un site pour différents types d'usage
   */
  async calculer(site: Site, options: CalculOptions = {}): Promise<MutabiliteOutputDto> {
    const { modeDetaille = false } = options;

    // Résoudre la configuration de l'algorithme
    const config = options.versionAlgorithme
      ? getAlgorithmeConfig(options.versionAlgorithme)
      : undefined;
    const poidsCriteres = (config?.poidsCriteres ?? POIDS_CRITERES) as Record<string, number>;
    const matriceScoring = (config?.matriceScoring ?? MATRICE_SCORING) as Record<string, unknown>;

    // Calculer et trier les résultats par indice décroissant
    const resultatsCalcules = Object.values(UsageType)
      .map((usage) =>
        this.calculerIndiceMutabilite(site, usage, options, poidsCriteres, matriceScoring),
      )
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

    const fiabilite = this.calculerFiabilite(site, poidsCriteres);

    return {
      fiabilite,
      resultats: resultats as UsageResultat[],
    };
  }

  /**
   * Calcule l'indice de mutabilité pour un usage spécifique
   */
  protected calculerIndiceMutabilite(
    site: Site,
    usage: UsageType,
    options: CalculOptions = {},
    poidsCriteres: Record<string, number> = POIDS_CRITERES as Record<string, number>,
    matriceScoring: Record<string, unknown> = MATRICE_SCORING as Record<string, unknown>,
  ): CalculIntermediaire {
    const { modeDetaille = false } = options;

    // Etape 1: Calculer avantages et contraintes
    const scoreData = modeDetaille
      ? this.calculerScorePourUsageDetaille(site, usage, poidsCriteres, matriceScoring)
      : this.calculerScorePourUsage(site, usage, poidsCriteres, matriceScoring);

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
        detailsCriteresVides: DetailCritere[];
        detailsAvantages: DetailCritere[];
        detailsContraintes: DetailCritere[];
      };
      resultat.detailsCalcul = {
        detailsAvantages: scoreDetaille.detailsAvantages,
        detailsContraintes: scoreDetaille.detailsContraintes,
        detailsCriteresVides: scoreDetaille.detailsCriteresVides,
        totalAvantages: avantages,
        totalContraintes: contraintes,
      };
    }

    return resultat;
  }

  /**
   * Calcule les scores d'avantages et de contraintes pour un usage donné
   * Version corrigée : les critères NEUTRE comptent dans avantages ET contraintes (comme dans Excel)
   */
  protected calculerScorePourUsage(
    site: Site,
    usage: keyof ScoreParUsage,
    poidsCriteres: Record<string, number> = POIDS_CRITERES as Record<string, number>,
    matriceScoring: Record<string, unknown> = MATRICE_SCORING as Record<string, unknown>,
  ): { avantages: number; contraintes: number } {
    let avantages = 0;
    let contraintes = 0;

    // Mapper les propriétés du site aux critères (adapté selon la version)
    const criteres = this.extraireCriteres(site, poidsCriteres);

    // Pour chaque critère
    Object.entries(criteres).forEach(([champDTO, valeur]) => {
      // Ignorer si null/undefined
      if (valeur === null || valeur === undefined || valeur === "ne-sait-pas") return;

      // Obtenir le score pour ce critère
      const score = this.obtenirScoreCritere(champDTO, valeur, usage, matriceScoring);

      if (score === null) return;

      // Appliquer le poids
      const poids = (poidsCriteres[champDTO] as number) ?? 1;
      const pointsPonderes = score * poids;

      // LOGIQUE EXCEL : Les critères NEUTRE (0.5) comptent dans les deux côtés
      if (score === 0.5) {
        // NEUTRE
        avantages += Math.abs(pointsPonderes);
        contraintes += Math.abs(pointsPonderes);
      } else if (pointsPonderes > 0) {
        // Critères positifs vont uniquement dans avantages
        avantages += pointsPonderes;
      } else {
        // Critères négatifs vont uniquement dans contraintes
        contraintes += Math.abs(pointsPonderes);
      }
    });

    return { avantages, contraintes };
  }

  /**
   * Calcule les scores avec détails pour un usage donné
   * Version corrigée : les critères NEUTRE comptent dans avantages ET contraintes (comme dans Excel)
   */
  protected calculerScorePourUsageDetaille(
    site: Site,
    usage: keyof ScoreParUsage,
    poidsCriteres: Record<string, number> = POIDS_CRITERES as Record<string, number>,
    matriceScoring: Record<string, unknown> = MATRICE_SCORING as Record<string, unknown>,
  ): {
    avantages: number;
    contraintes: number;
    detailsCriteresVides: DetailCritere[];
    detailsAvantages: DetailCritere[];
    detailsContraintes: DetailCritere[];
  } {
    let avantages = 0;
    let contraintes = 0;
    const detailsAvantages: DetailCritere[] = [];
    const detailsContraintes: DetailCritere[] = [];
    const detailsCriteresVides: DetailCritere[] = [];

    const criteres = this.extraireCriteres(site, poidsCriteres);

    Object.entries(criteres).forEach(([champDTO, valeur]) => {
      // Ignorer si non renseigné
      if (valeur === null || valeur === undefined || valeur === "ne-sait-pas") {
        detailsCriteresVides.push({
          critere: champDTO,
          valeur: null,
          scoreBrut: 0,
          poids: 0,
          scorePondere: 0,
        });
        return;
      }

      const scoreBrut = this.obtenirScoreCritere(champDTO, valeur, usage, matriceScoring);

      if (scoreBrut === null) return;

      const poids = (poidsCriteres[champDTO] as number) ?? 1;
      const scorePondere = scoreBrut * poids;

      const detail: DetailCritere = {
        critere: champDTO,
        valeur: valeur as string | number | boolean,
        scoreBrut,
        poids,
        scorePondere: Math.abs(scorePondere),
      };

      // LOGIQUE EXCEL : Les critères NEUTRE (0.5) comptent dans les deux côtés
      if (scoreBrut === 0.5) {
        // NEUTRE
        avantages += Math.abs(scorePondere);
        contraintes += Math.abs(scorePondere);

        // Ajouter aux deux listes pour le détail
        detailsAvantages.push(detail);
        // Créer une copie pour éviter les problèmes de référence
        detailsContraintes.push({
          critere: detail.critere,
          valeur: detail.valeur,
          scoreBrut: detail.scoreBrut,
          poids: detail.poids,
          scorePondere: detail.scorePondere,
        });
      } else if (scorePondere > 0) {
        // Critères positifs vont uniquement dans avantages
        avantages += scorePondere;
        detailsAvantages.push(detail);
      } else {
        // Critères négatifs vont uniquement dans contraintes
        contraintes += Math.abs(scorePondere);
        detailsContraintes.push(detail);
      }
    });

    // Trier par impact décroissant
    detailsAvantages.sort((a, b) => b.scorePondere - a.scorePondere);
    detailsContraintes.sort((a, b) => b.scorePondere - a.scorePondere);

    return { avantages, contraintes, detailsCriteresVides, detailsAvantages, detailsContraintes };
  }

  /**
   * Extrait les critères de calcul depuis l'entité Site
   * Adapte les critères en fonction de la version de l'algorithme :
   * - v1.1/v1.2 : critère unique presenceRisquesNaturels (combiné depuis les 3 risques séparés)
   * - v1.3 : 3 critères séparés + zoneAccelerationEnr
   * - v1.5 : ajout de presenceEspecesProtegees
   * - v1.6 : ajout de presenceZoneHumide
   */
  protected extraireCriteres(
    site: Site,
    poidsCriteres?: Record<string, number>,
  ): Record<string, unknown> {
    // Critères communs à toutes les versions
    const criteres: Record<string, unknown> = {
      surfaceSite: site.surfaceSite,
      surfaceBati: site.surfaceBati,
      typeProprietaire: site.typeProprietaire,
      raccordementEau: site.raccordementEau,
      etatBatiInfrastructure: site.etatBatiInfrastructure,
      presencePollution: site.presencePollution,
      valeurArchitecturaleHistorique: site.valeurArchitecturaleHistorique,
      qualitePaysage: site.qualitePaysage,
      qualiteVoieDesserte: site.qualiteVoieDesserte,
      siteEnCentreVille: site.siteEnCentreVille,
      distanceAutoroute: site.distanceAutoroute,
      distanceTransportCommun: site.distanceTransportCommun,
      proximiteCommercesServices: site.proximiteCommercesServices,
      distanceRaccordementElectrique: site.distanceRaccordementElectrique,
      tauxLogementsVacants: site.tauxLogementsVacants,
      presenceRisquesTechnologiques: site.presenceRisquesTechnologiques,
      zonageEnvironnemental: site.zonageEnvironnemental,
      zonageReglementaire: site.zonageReglementaire,
      zonagePatrimonial: site.zonagePatrimonial,
      trameVerteEtBleue: site.trameVerteEtBleue,
    };

    // Adapter les critères de risques naturels selon la version
    const utiliseAncienModeleRisques = poidsCriteres && "presenceRisquesNaturels" in poidsCriteres;

    if (utiliseAncienModeleRisques) {
      // v1.1/v1.2/v1.3 : combiner les 3 risques séparés en un seul critère
      criteres.presenceRisquesNaturels = this.combinerRisquesNaturels(site);
    } else {
      // v1.4+ : 3 critères séparés
      criteres.risqueRetraitGonflementArgile = site.risqueRetraitGonflementArgile;
      criteres.risqueCavitesSouterraines = site.risqueCavitesSouterraines;
      criteres.risqueInondation = site.risqueInondation;
    }

    // ZAER : indépendant du modèle de risques (v1.3+)
    if (!poidsCriteres || "zoneAccelerationEnr" in poidsCriteres) {
      criteres.zoneAccelerationEnr = site.zoneAccelerationEnr;
    }

    // Présence d'espèces protégées (v1.5+)
    if (!poidsCriteres || "presenceEspecesProtegees" in poidsCriteres) {
      criteres.presenceEspecesProtegees = site.presenceEspecesProtegees;
    }

    // Présence d'une zone humide (v1.6+)
    if (!poidsCriteres || "presenceZoneHumide" in poidsCriteres) {
      criteres.presenceZoneHumide = site.presenceZoneHumide;
    }

    return criteres;
  }

  /**
   * Combine les 3 critères de risques naturels v1.3 en un seul critère v1.1/v1.2
   * Mapping : prend le niveau de risque le plus élevé parmi les 3 critères
   */
  private combinerRisquesNaturels(site: Site): RisqueNaturel | null {
    const argile = site.risqueRetraitGonflementArgile;
    const cavites = site.risqueCavitesSouterraines;
    const inondation = site.risqueInondation;

    // Si aucun critère n'est renseigné, retourner null
    if (!argile && !cavites && !inondation) return null;

    // Argile "fort" → risque FORT
    if (argile === "fort") return RisqueNaturel.FORT;

    // Inondation "oui", cavités "oui", ou argile "faible-ou-moyen" → risque MOYEN
    if (inondation === "oui" || cavites === "oui" || argile === "faible-ou-moyen") {
      return RisqueNaturel.MOYEN;
    }

    // Tous les critères renseignés sont à aucun/non → AUCUN
    return RisqueNaturel.AUCUN;
  }

  /**
   * Obtient le score d'un critère spécifique pour un usage
   */
  protected obtenirScoreCritere(
    champDTO: string,
    valeur: unknown,
    usage: keyof ScoreParUsage,
    matriceScoring: Record<string, unknown> = MATRICE_SCORING as Record<string, unknown>,
  ): number | null {
    const matriceCritere = matriceScoring[champDTO];

    // Critère non mappé
    if (!matriceCritere) {
      return null;
    }

    // Si c'est une fonction (critères numériques)
    if (typeof matriceCritere === "function") {
      const scoreResult = matriceCritere(valeur as number);
      return scoreResult[usage];
    }

    // Si c'est un objet (enums ou booléens)
    const cleIndex = this.convertirEnCleIndex(valeur);
    const typedMatrice = matriceCritere as Record<string | number, ScoreParUsage>;
    const scores = typedMatrice[cleIndex];

    if (!scores) {
      console.log(
        `obtenirScoreCritere - Pas de score pour "${champDTO}" avec valeur "${cleIndex}"`,
      );
    }

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
  protected calculerFiabilite(site: Site, poidsCriteres?: Record<string, number>): Fiabilite {
    const criteres = this.extraireCriteres(site, poidsCriteres);
    // Toujours inclure le détail pour la fiabilité (stocké en BDD)
    return this.fiabiliteCalculator.calculer(criteres, {
      inclureDetail: true,
      poidsCriteres,
    });
  }
  /**
   * Détermine le niveau de potentiel en fonction de l'indice
   */
  protected determinerPotentiel(indice: number): string {
    if (indice >= 70) return "Excellent";
    if (indice >= 60) return "Très bon";
    if (indice >= 50) return "Bon";
    if (indice >= 40) return "Moyen";
    return "Faible";
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
