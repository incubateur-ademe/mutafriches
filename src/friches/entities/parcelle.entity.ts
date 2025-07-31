import {
  RisqueNaturel,
  TrameVerteEtBleue,
  ZonageEnvironnemental,
  ZonagePatrimonial,
} from '../enums/parcelle.enums';

/**
 * Classe représentant une parcelle avec toutes ses caractéristiques
 * pour l'analyse de mutabilité
 */
export class Parcelle {
  /**
   * Identifiant unique de la parcelle (format cadastral)
   * Exemple: "490007000ZE0153"
   */
  identifiantParcelle: string;

  /**
   * Nom de la commune où se situe la parcelle
   * Exemple: "Trélazé"
   */
  commune: string;

  /**
   * Surface totale du site en mètres carrés
   * Exemple: 42780
   */
  surfaceSite: number;

  /**
   * Surface au sol occupée par les bâtiments en mètres carrés
   * Peut être undefined si non déterminable
   * Exemple: 6600
   */
  surfaceBati?: number;

  /**
   * Indique si le site est connecté au réseau électrique
   * true = connecté, false = non connecté
   */
  connectionReseauElectricite: boolean;

  /**
   * Distance au point de raccordement électrique le plus proche en kilomètres
   * Exemple: 0.3
   */
  distanceRaccordementElectrique: number;

  /**
   * Indique si le site se trouve en centre-ville ou centre-bourg
   * true = centre-ville, false = périphérie
   */
  siteEnCentreVille: boolean;

  /**
   * Distance à l'entrée d'autoroute la plus proche en kilomètres
   * Exemple: 1.5
   */
  distanceAutoroute: number;

  /**
   * Distance à l'arrêt de transport en commun le plus proche en mètres
   * Exemple: 250
   */
  distanceTransportCommun: number;

  /**
   * Indique la présence de commerces et services à proximité
   * true = présence, false = absence
   */
  proximiteCommercesServices: boolean;

  /**
   * Taux de logements vacants dans la commune en pourcentage
   * Exemple: 4.9
   */
  tauxLogementsVacants: number;

  /**
   * Description de l'ancienne activité du site
   * Peut être undefined si inconnue
   * Exemple: "Manufacture textile"
   */
  ancienneActivite?: string;

  /**
   * Indique la présence de risques technologiques
   * true = présence de risques, false = absence
   */
  presenceRisquesTechnologiques: boolean;

  /**
   * Niveau de risques naturels (inondations, argiles, etc.)
   */
  presenceRisquesNaturels: RisqueNaturel;

  /**
   * Type de zonage environnemental applicable
   */
  zonageEnvironnemental: ZonageEnvironnemental;

  /**
   * Zonage réglementaire selon le PLU/PLUi
   * Exemple: "Zone urbaine - U", "Zone naturelle - N"
   */
  zonageReglementaire: string;

  /**
   * Type de protection patrimoniale
   */
  zonagePatrimonial: ZonagePatrimonial;

  /**
   * Position par rapport à la trame verte et bleue
   */
  trameVerteEtBleue: TrameVerteEtBleue;

  /**
   * Identifiant de session pour lier avec les résultats de mutabilité
   * Utilisé pour tracer le processus d'analyse
   */
  sessionId?: string;

  /**
   * Coordonnées géographiques de la parcelle
   * Utilisées pour les calculs de distance
   */
  coordonnees?: {
    latitude: number;
    longitude: number;
  };

  /**
   * Informations complémentaires sur le propriétaire
   * Exemple: "Privé", "Public", "Bailleur social"
   */
  typeProprietaire?: string;

  /**
   * Nom du propriétaire (pour information)
   * Exemple: "Jean Dupont", "Mairie de Trélazé"
   */
  nomProprietaire?: string;

  /**
   * Nombre de bâtiments sur la parcelle
   * Exemple: 8
   */
  nombreBatiments?: number;

  /**
   * État général du bâti et des infrastructures
   * Exemple: "Bâtiments hétérogènes", "Bon état", "Dégradé"
   */
  etatBatiInfrastructure?: string;

  /**
   * Présence de pollution connue ou suspectée
   * Exemple: "Oui", "Non", "Ne sait pas"
   */
  presencePollution?: string;

  /**
   * Indique si le terrain présente une pente significative (>20°)
   */
  terrainEnPente?: boolean;

  /**
   * Indique si le terrain est déjà viabilisé
   * true = viabilisé, false = non viabilisé
   */
  terrainViabilise?: boolean;

  /**
   * Qualité de la voie de desserte
   * Exemple: "Accessible", "Difficile", "Très difficile"
   */
  qualiteVoieDesserte?: string;

  /**
   * Présence d'une voie d'eau à proximité
   */
  voieEauProximite?: boolean;

  /**
   * Qualité du paysage environnant
   * Exemple: "Exceptionnel", "Remarquable", "Banal", "Dégradé"
   */
  qualitePaysage?: string;

  /**
   * Valeur architecturale et/ou historique du site
   * Exemple: "Exceptionnel", "Remarquable", "Ordinaire"
   */
  valeurArchitecturaleHistorique?: string;

  /**
   * Type de couvert végétal présent
   * Exemple: "Imperméabilisé", "Pelouse", "Arbustes", "Forêt"
   */
  couvertVegetal?: string;

  /**
   * Présence d'espèces protégées recensées
   * true = présence confirmée, false = absence
   */
  presenceEspeceProtegee?: boolean;

  /**
   * Présence dans une zone humide
   * Exemple: "Présence", "Absence", "Potentielle"
   */
  zoneHumide?: string;

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
    this.zonageReglementaire = '';
    this.zonagePatrimonial = ZonagePatrimonial.NON_CONCERNE;
    this.trameVerteEtBleue = TrameVerteEtBleue.HORS_TRAME;
  }

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

    if (!this.identifiantParcelle) missing.push('identifiantParcelle');
    if (!this.commune) missing.push('commune');
    if (!this.surfaceSite || this.surfaceSite <= 0) missing.push('surfaceSite');
    if (!this.zonageReglementaire) missing.push('zonageReglementaire');
    if (this.surfaceBati === undefined) missing.push('surfaceBati');
    if (!this.ancienneActivite) missing.push('ancienneActivite');

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
    return `Parcelle ${this.identifiantParcelle} à ${this.commune} - ${this.surfaceSite}m² - ${this.siteEnCentreVille ? 'Centre-ville' : 'Périphérie'}`;
  }
}
