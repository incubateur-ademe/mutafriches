import { Injectable } from "@nestjs/common";
import { Fiabilite, NIVEAUX_FIABILITE } from "@mutafriches/shared-types";
import { POIDS_CRITERES } from "./algorithme.config";
import { NOMBRE_CRITERES_UTILISES } from "./algorithme.constants";

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
   * @returns Objet Fiabilite avec note sur 10
   */
  calculer(criteres: Record<string, unknown>): Fiabilite {
    const { poidsRenseignes, criteresRenseignes } = this.calculerPoidsRenseignes(criteres);

    const pourcentage = this.poidsTotal > 0 ? (poidsRenseignes / this.poidsTotal) * 100 : 0;
    const note = this.arrondirNote(pourcentage / 10);
    const niveau = this.determinerNiveau(note);

    return {
      note,
      text: niveau.text,
      description: niveau.description,
      criteresRenseignes,
      criteresTotal: NOMBRE_CRITERES_UTILISES,
    };
  }

  /**
   * Calcule la somme des poids des critères renseignés
   */
  private calculerPoidsRenseignes(criteres: Record<string, unknown>): {
    poidsRenseignes: number;
    criteresRenseignes: number;
  } {
    let poidsRenseignes = 0;
    let criteresRenseignes = 0;

    Object.entries(criteres).forEach(([champDTO, valeur]) => {
      if (this.estRenseigne(valeur)) {
        const poids = POIDS_CRITERES[champDTO as keyof typeof POIDS_CRITERES] ?? 0;
        poidsRenseignes += poids;
        criteresRenseignes++;
      }
    });

    return { poidsRenseignes, criteresRenseignes };
  }

  /**
   * Vérifie si une valeur est considérée comme renseignée
   */
  private estRenseigne(valeur: unknown): boolean {
    return valeur !== null && valeur !== undefined && valeur !== "ne-sait-pas";
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
