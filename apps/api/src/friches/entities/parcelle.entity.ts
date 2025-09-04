import {
  TypeProprietaire,
  EtatBati,
  PresencePollution,
  QualitePaysage,
  ValeurArchitecturale,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  ZonageReglementaire,
  QualiteVoieDesserte,
} from "@mutafriches/shared-types";
import { ParcelleBase } from "./shared/parcelle.base";

/**
 * Classe représentant une parcelle avec toutes ses caractéristiques
 * pour l'analyse de mutabilité
 */
export class Parcelle implements ParcelleBase {
  /**
   * Constructeur pour créer une nouvelle instance de Parcelle
   */
  constructor(identifiantParcelle: string, commune: string) {
    this.identifiantParcelle = identifiantParcelle;
    this.commune = commune;

    // Valeurs par défaut pour les champs obligatoires
    this.surfaceSite = 0;
    this.connectionReseauElectricite = false;
    this.distanceRaccordementElectrique = 0;
    this.siteEnCentreVille = false;
    this.distanceAutoroute = 0;
    this.distanceTransportCommun = 0;
    this.proximiteCommercesServices = false;
    this.tauxLogementsVacants = 0;
    this.presenceRisquesTechnologiques = false;
    this.presenceRisquesNaturels = RisqueNaturel.AUCUN;
    this.zonageEnvironnemental = ZonageEnvironnemental.HORS_ZONE;
    this.zonageReglementaire = ZonageReglementaire.ZONE_ACTIVITES;
    this.zonagePatrimonial = ZonagePatrimonial.NON_CONCERNE;
    this.trameVerteEtBleue = TrameVerteEtBleue.HORS_TRAME;

    // Valeurs optionnelles initialisées à undefined
    this.typeProprietaire = undefined;
    this.etatBatiInfrastructure = undefined;
    this.presencePollution = undefined;
    this.qualiteVoieDesserte = undefined;
    this.qualitePaysage = undefined;
    this.valeurArchitecturaleHistorique = undefined;
    this.terrainViabilise = undefined;
  }
  identifiantParcelle: string;
  commune: string;
  surfaceSite: number;
  surfaceBati?: number | undefined;
  connectionReseauElectricite: boolean;
  distanceRaccordementElectrique: number;
  siteEnCentreVille: boolean;
  distanceAutoroute: number;
  distanceTransportCommun: number;
  proximiteCommercesServices: boolean;
  tauxLogementsVacants: number;
  ancienneActivite?: string | undefined;
  presenceRisquesTechnologiques: boolean;
  presenceRisquesNaturels: RisqueNaturel;
  zonageEnvironnemental: ZonageEnvironnemental;
  zonageReglementaire: ZonageReglementaire;
  zonagePatrimonial: ZonagePatrimonial;
  trameVerteEtBleue: TrameVerteEtBleue;
  typeProprietaire?: TypeProprietaire | undefined;
  etatBatiInfrastructure?: EtatBati | undefined;
  presencePollution?: PresencePollution | undefined;
  qualiteVoieDesserte?: QualiteVoieDesserte | undefined;
  qualitePaysage?: QualitePaysage | undefined;
  valeurArchitecturaleHistorique?: ValeurArchitecturale | undefined;
  terrainViabilise?: boolean | undefined;
  sessionId?: string | undefined;
  coordonnees?: { latitude: number; longitude: number } | undefined;

  /**
   * Vérifie si toutes les données obligatoires sont présentes
   * @returns true si la parcelle est complète, false sinon
   */
  isComplete(): boolean {
    return !!(
      this.identifiantParcelle &&
      this.commune &&
      this.surfaceSite > 0 &&
      this.zonageReglementaire
    );
  }

  /**
   * Retourne la liste des champs manquants
   * @returns Array des noms de champs manquants
   */
  getMissingFields(): string[] {
    const missing: string[] = [];

    if (!this.identifiantParcelle) missing.push("identifiantParcelle");
    if (!this.commune) missing.push("commune");
    if (!this.surfaceSite || this.surfaceSite <= 0) missing.push("surfaceSite");
    if (!this.zonageReglementaire) missing.push("zonageReglementaire");
    if (this.surfaceBati === undefined) missing.push("surfaceBati");
    if (!this.ancienneActivite) missing.push("ancienneActivite");

    return missing;
  }

  /**
   * Calcule un score de complétude de la parcelle
   * @returns Score entre 0 et 100
   */
  getCompletudeScore(): number {
    const totalFields = 28; // Nombre total de champs dans la classe
    const missingFields = this.getMissingFields().length;
    return Math.round(((totalFields - missingFields) / totalFields) * 100);
  }

  /**
   * Retourne un résumé textuel de la parcelle
   * @returns Description courte de la parcelle
   */
  getDescription(): string {
    return `Parcelle ${this.identifiantParcelle} à ${this.commune} - ${this.surfaceSite}m² - ${this.siteEnCentreVille ? "Centre-ville" : "Périphérie"}`;
  }
}
