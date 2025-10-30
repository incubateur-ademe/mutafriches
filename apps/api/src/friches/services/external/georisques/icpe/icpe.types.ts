/**
 * Types spécifiques pour l'API ICPE (Installations Classées pour la Protection de l'Environnement)
 */

/**
 * Rubrique d'une installation classée
 */
export interface IcpeRubrique {
  numeroRubrique: string;
  nature: string;
  alinea: string;
  regimeAutoriseAlinea: string;
  quantiteTotale: string;
  unite: string;
  dateMotif: string; // Format: YYYY-MM-DD
}

/**
 * Fichier associé à une inspection ou un document
 */
export interface IcpeFichier {
  identifiantFichier: string;
  nomFichier: string;
  typeFichier: string;
  dateFichier: string; // Format ISO 8601
  urlFichier: string;
}

/**
 * Inspection d'une installation classée
 */
export interface IcpeInspection {
  dateInspection: string; // Format ISO 8601
  fichierInspection: IcpeFichier;
}

/**
 * Données brutes d'une installation classée depuis l'API GeoRisques
 */
export interface IcpeApiData {
  raisonSociale: string;
  adresse1: string;
  adresse2: string;
  adresse3: string;
  codePostal: string;
  codeInsee: string;
  commune: string;
  codeNaf: string;
  longitude: number;
  latitude: number;
  bovins: boolean;
  porcs: boolean;
  volailles: boolean;
  carriere: boolean;
  eolienne: boolean;
  industrie: boolean;
  prioriteNationale: boolean;
  statutSeveso: string;
  ied: boolean;
  etatActivite: string;
  codeAIOT: string;
  siret: string;
  coordonneeXAIOT: number;
  coordonneeYAIOT: number;
  systemeCoordonneesAIOT: string;
  serviceAIOT: string;
  regime: string;
  rubriques: IcpeRubrique[];
  inspections: IcpeInspection[];
  documentsHorsInspection: IcpeFichier[];
  date_maj: string; // Format ISO 8601
}

/**
 * Réponse brute de l'API GeoRisques ICPE
 */
export interface IcpeApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: IcpeApiData[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * Régime d'autorisation ICPE
 */
export type IcpeRegime = "A" | "E" | "AUTRE";

/**
 * Statut SEVESO
 */
export type IcpeStatutSeveso = "1" | "2" | "3"; // 1: Seuil haut, 2: Seuil bas, 3: Non Seveso

/**
 * Résumé d'une installation classée (pour affichage simplifié)
 */
export interface IcpeSummary {
  codeAIOT: string;
  raisonSociale: string;
  adresseComplete: string;
  commune: string;
  codePostal: string;
  regime: string;
  statutSeveso: string;
  etatActivite: string;
  prioriteNationale: boolean;
  ied: boolean;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // Distance en mètres (si recherche par rayon)
  nombreInspections: number;
  derniereInspection?: string; // Format ISO 8601
  dateMaj: string;
}

/**
 * Résultat ICPE normalisé pour Mutafriches
 */
export interface IcpeResultNormalized {
  presenceIcpe: boolean;
  nombreIcpe: number;
  icpeProches: IcpeSummary[];
  presenceSeveso: boolean;
  nombreSeveso: number;
  presencePrioriteNationale: boolean;
  plusProche?: IcpeSummary; // ICPE la plus proche
  distancePlusProche?: number; // Distance en mètres
  source: string;
  dateRecuperation: string;
}
/**
 * Paramètres de recherche ICPE par code INSEE
 */
export interface IcpeSearchByInseeParams {
  codeInsee: string;
  pageSize?: number;
}

/**
 * Paramètres de recherche ICPE par coordonnées
 */
export interface IcpeSearchByLatLonParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres (max 10000, défaut 1000)
  pageSize?: number;
}
