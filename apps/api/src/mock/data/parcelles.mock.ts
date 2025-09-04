import { Parcelle } from "../../friches/entities/parcelle.entity";
import {
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  ZonageReglementaire,
} from "../../friches/enums/parcelle.enums";

/**
 * Base de données mockée utilisant l'entité Parcelle
 * Basée sur l'exemple Excel "Ancienne manufacture Les Allumettes" à Trélazé
 */
export const MOCK_PARCELLES: Record<string, Parcelle> = {};

/**
 * Helpers pour créer et gérer les parcelles mockées
 */
export class MockParcellesHelper {
  /**
   * Initialise les parcelles par défaut
   */
  static initializeDefaultParcelles(): void {
    // Parcelle principale - Exemple Excel Trélazé
    const trelazeParcel = new Parcelle("490007000ZE0153", "Trélazé");
    trelazeParcel.surfaceSite = 42780;
    trelazeParcel.surfaceBati = 6600;
    trelazeParcel.coordonnees = { latitude: 47.4514, longitude: -0.4619 };
    trelazeParcel.connectionReseauElectricite = true;
    trelazeParcel.distanceRaccordementElectrique = 0.3;
    trelazeParcel.siteEnCentreVille = true;
    trelazeParcel.distanceAutoroute = 1.5;
    trelazeParcel.distanceTransportCommun = 250;
    trelazeParcel.proximiteCommercesServices = true;
    trelazeParcel.tauxLogementsVacants = 4.9;
    trelazeParcel.ancienneActivite = "Manufacture textile - Les Allumettes";
    trelazeParcel.presenceRisquesTechnologiques = false;
    trelazeParcel.presenceRisquesNaturels = RisqueNaturel.FAIBLE;
    trelazeParcel.zonageEnvironnemental = ZonageEnvironnemental.HORS_ZONE;
    trelazeParcel.zonageReglementaire = ZonageReglementaire.ZONE_ACTIVITES;
    trelazeParcel.zonagePatrimonial = ZonagePatrimonial.NON_CONCERNE;
    trelazeParcel.trameVerteEtBleue = TrameVerteEtBleue.HORS_TRAME;

    MOCK_PARCELLES[trelazeParcel.identifiantParcelle] = trelazeParcel;

    // Parcelle secondaire - Angers
    const angersParcel = new Parcelle("490007000AB0001", "Angers");
    angersParcel.surfaceSite = 15000;
    angersParcel.surfaceBati = 2500;
    angersParcel.coordonnees = { latitude: 47.4784, longitude: -0.5632 };
    angersParcel.connectionReseauElectricite = true;
    angersParcel.distanceRaccordementElectrique = 0.8;
    angersParcel.siteEnCentreVille = false;
    angersParcel.distanceAutoroute = 0.5;
    angersParcel.distanceTransportCommun = 800;
    angersParcel.proximiteCommercesServices = false;
    angersParcel.tauxLogementsVacants = 7.2;
    angersParcel.ancienneActivite = "Entrepôt logistique";
    angersParcel.presenceRisquesTechnologiques = true;
    angersParcel.presenceRisquesNaturels = RisqueNaturel.MOYEN;
    angersParcel.zonageEnvironnemental = ZonageEnvironnemental.ZNIEFF_TYPE_1_2;
    angersParcel.zonageReglementaire = ZonageReglementaire.ZONE_A_URBANISER_AU;
    angersParcel.zonagePatrimonial = ZonagePatrimonial.NON_CONCERNE;
    angersParcel.trameVerteEtBleue = TrameVerteEtBleue.CORRIDOR_A_RESTAURER;

    MOCK_PARCELLES[angersParcel.identifiantParcelle] = angersParcel;

    // Parcelle tertiaire - Saumur
    const saumurParcel = new Parcelle("490007000CD0042", "Saumur");
    saumurParcel.surfaceSite = 8500;
    saumurParcel.surfaceBati = 1200;
    saumurParcel.coordonnees = { latitude: 47.2692, longitude: -0.0737 };
    saumurParcel.connectionReseauElectricite = false;
    saumurParcel.distanceRaccordementElectrique = 1.2;
    saumurParcel.siteEnCentreVille = false;
    saumurParcel.distanceAutoroute = 3.0;
    saumurParcel.distanceTransportCommun = 1500;
    saumurParcel.proximiteCommercesServices = false;
    saumurParcel.tauxLogementsVacants = 12.1;
    saumurParcel.ancienneActivite = "Exploitation agricole";
    saumurParcel.presenceRisquesTechnologiques = false;
    saumurParcel.presenceRisquesNaturels = RisqueNaturel.AUCUN;
    saumurParcel.zonageEnvironnemental = ZonageEnvironnemental.NATURA_2000;
    saumurParcel.zonageReglementaire = ZonageReglementaire.ZONE_NATURELLE;
    saumurParcel.zonagePatrimonial = ZonagePatrimonial.MONUMENT_HISTORIQUE;
    saumurParcel.trameVerteEtBleue = TrameVerteEtBleue.RESERVOIR_BIODIVERSITE;

    MOCK_PARCELLES[saumurParcel.identifiantParcelle] = saumurParcel;
  }

  /**
   * Récupère une parcelle par son identifiant
   */
  static findById(identifiant: string): Parcelle | null {
    return MOCK_PARCELLES[identifiant] || null;
  }

  /**
   * Liste tous les identifiants disponibles
   */
  static getAllIds(): string[] {
    return Object.keys(MOCK_PARCELLES);
  }

  /**
   * Trouve une parcelle par coordonnées (approximatif)
   */
  static findByCoordinates(latitude: number, longitude: number, tolerance = 0.01): Parcelle | null {
    return (
      Object.values(MOCK_PARCELLES).find(
        (p) =>
          p.coordonnees &&
          Math.abs(p.coordonnees.latitude - latitude) < tolerance &&
          Math.abs(p.coordonnees.longitude - longitude) < tolerance,
      ) || null
    );
  }

  /**
   * Ajoute une parcelle à la base mock (pour les tests)
   */
  static addParcelle(data: Parcelle): void {
    MOCK_PARCELLES[data.identifiantParcelle] = data;
  }

  /**
   * Supprime une parcelle (pour les tests)
   */
  static removeParcelle(identifiant: string): void {
    delete MOCK_PARCELLES[identifiant];
  }

  /**
   * Reset aux données par défaut
   */
  static reset(): void {
    const defaultIds = ["490007000ZE0153", "490007000AB0001", "490007000CD0042"];

    Object.keys(MOCK_PARCELLES).forEach((id) => {
      if (!defaultIds.includes(id)) {
        delete MOCK_PARCELLES[id];
      }
    });
  }

  /**
   * Vérifie la complétude des parcelles mockées
   */
  static checkCompletudeAll(): Record<string, number> {
    const completude: Record<string, number> = {};

    Object.entries(MOCK_PARCELLES).forEach(([id, parcelle]) => {
      completude[id] = parcelle.getCompletudeScore();
    });

    return completude;
  }
}

// Initialise les parcelles par défaut au chargement du module
MockParcellesHelper.initializeDefaultParcelles();
