import { Injectable } from "@nestjs/common";
import { Fiabilite, DetailCritereFiabilite, NIVEAUX_FIABILITE } from "@mutafriches/shared-types";
import { POIDS_CRITERES } from "./algorithme.config";
import { NOMBRE_CRITERES_UTILISES } from "./algorithme.constants";

export interface FiabiliteOptions {
  inclureDetail?: boolean;
}

/**
 * Calculateur de fiabilité pour l'évaluation de mutabilité
 *
 * La fiabilité est calculée en fonction de la somme des poids
 * des critères renseignés par rapport au poids total possible.
 */
@Injectable()
export class FiabiliteCalculator {
  private readonly poidsTotal: number;

  constructor() {
    this.poidsTotal = Object.values(POIDS_CRITERES).reduce((sum, poids) => sum + poids, 0);
  }

  /**
   * Calcule la fiabilité à partir des critères extraits d'une parcelle
   *
   * @param criteres - Record des critères avec leurs valeurs
   * @param options - Options de calcul (inclureDetail pour avoir le detail par critere, actif par défaut)
   * @returns Objet Fiabilite avec note sur 10
   */
  calculer(criteres: Record<string, unknown>, options: FiabiliteOptions = {}): Fiabilite {
    const { inclureDetail = true } = options;
    const { poidsRenseignes, criteresRenseignes, detailCriteres } =
      this.calculerPoidsRenseignes(criteres);

    const pourcentage = this.poidsTotal > 0 ? (poidsRenseignes / this.poidsTotal) * 100 : 0;
    const note = this.arrondirNote(pourcentage / 10);
    const niveau = this.determinerNiveau(note);

    const fiabilite: Fiabilite = {
      note,
      text: niveau.text,
      description: niveau.description,
      criteresRenseignes,
      criteresTotal: NOMBRE_CRITERES_UTILISES,
      poidsRenseignes,
      poidsTotal: this.poidsTotal,
    };

    if (inclureDetail) {
      fiabilite.detailCriteres = detailCriteres;
    }

    return fiabilite;
  }

  /**
   * Calcule la somme des poids des criteres renseignes
   */
  private calculerPoidsRenseignes(criteres: Record<string, unknown>): {
    poidsRenseignes: number;
    criteresRenseignes: number;
    detailCriteres: DetailCritereFiabilite[];
  } {
    let poidsRenseignes = 0;
    let criteresRenseignes = 0;
    const detailCriteres: DetailCritereFiabilite[] = [];

    // Parcourir tous les criteres definis dans POIDS_CRITERES
    Object.entries(POIDS_CRITERES).forEach(([champDTO, poids]) => {
      const valeur = criteres[champDTO];
      const renseigne = this.estRenseigne(valeur);

      if (renseigne) {
        poidsRenseignes += poids;
        criteresRenseignes++;
      }

      detailCriteres.push({
        critere: champDTO,
        poids,
        renseigne,
      });
    });

    return { poidsRenseignes, criteresRenseignes, detailCriteres };
  }

  /**
   * Vérifie si une valeur est considérée comme renseignée
   * Note : null signifie "recherche effectuée, aucun résultat" (ex: pas de transport dans le rayon)
   * tandis que undefined signifie "donnée non disponible" (erreur technique)
   */
  private estRenseigne(valeur: unknown): boolean {
    return valeur !== undefined && valeur !== "ne-sait-pas";
  }

  /**
   * Arrondit la note à 0.5 près
   */
  private arrondirNote(note: number): number {
    return Math.round(note * 2) / 2;
  }

  /**
   * Détermine le niveau de fiabilité selon la note
   */
  private determinerNiveau(note: number): { text: string; description: string } {
    const niveau = NIVEAUX_FIABILITE.find((n) => note >= n.seuilMin);
    return niveau || NIVEAUX_FIABILITE[NIVEAUX_FIABILITE.length - 1];
  }

  /**
   * Retourne le poids total pour les tests
   */
  getPoidsTotal(): number {
    return this.poidsTotal;
  }
}
