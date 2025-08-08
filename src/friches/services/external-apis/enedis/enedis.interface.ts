import { ApiResponse } from '../shared/api-response.interface';

export interface EnedisRaccordement {
  distance: number; // distance en kilomètres jusqu'au plus proche point de raccordement
  type: 'BT' | 'HTA'; // Basse Tension / Haute Tension
  capaciteDisponible: boolean; // estimation de la capacité disponible
  posteProche?: {
    nom: string;
    commune: string;
    coordonnees: {
      latitude: number;
      longitude: number;
    };
  };
  infrastructureProche?: {
    type: 'poste' | 'ligne_bt' | 'poteau';
    distance: number; // en mètres
    tension: 'BT' | 'HTA';
  };
}

export interface EnedisConnexionStatus {
  isConnected: boolean; // true si des infrastructures électriques sont détectées à proximité
  confidence: 'high' | 'medium' | 'low'; // niveau de confiance de l'estimation
  sources: string[]; // sources de données utilisées
  details: {
    postesProches: number; // nombre de postes dans un rayon de 2km
    lignesBTProches: number; // nombre de lignes BT dans un rayon de 100m
    poteauxProches: number; // nombre de poteaux dans un rayon de 50m
  };
}

export interface EnedisAnalyseComplete {
  raccordement: EnedisRaccordement;
  connexion: EnedisConnexionStatus;
  recommandations: string[];
  coutEstime?: {
    min: number;
    max: number;
    devise: 'EUR';
    commentaire: string;
  };
}

export interface IEnedisService {
  /**
   * Calcule la distance au plus proche point de raccordement électrique
   * @param latitude - Latitude WGS84 du point à analyser
   * @param longitude - Longitude WGS84 du point à analyser
   * @returns Distance et type de raccordement disponible
   */
  getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisRaccordement>>;

  /**
   * Vérifie si une parcelle semble raccordable au réseau électrique
   * @param identifiantParcelle - Identifiant cadastral de la parcelle
   * @returns Statut de connexion estimé
   */
  checkConnection(
    identifiantParcelle: string,
  ): Promise<ApiResponse<EnedisConnexionStatus>>;

  /**
   * Analyse complète de raccordabilité pour une position
   * @param latitude - Latitude WGS84
   * @param longitude - Longitude WGS84
   * @returns Analyse détaillée avec recommandations
   */
  analyseComplete(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisAnalyseComplete>>;

  /**
   * Recherche les infrastructures électriques dans un rayon donné
   * @param latitude - Latitude WGS84
   * @param longitude - Longitude WGS84
   * @param rayonMetres - Rayon de recherche en mètres (défaut: 1000)
   * @returns Liste des infrastructures trouvées
   */
  rechercherInfrastructures(
    latitude: number,
    longitude: number,
    rayonMetres?: number,
  ): Promise<
    ApiResponse<{
      postes: Array<{ distance: number; nom: string; commune: string }>;
      lignesBT: Array<{ distance: number; type: string; tension: string }>;
      poteaux: Array<{ distance: number; tension: string }>;
    }>
  >;
}

export type TypeInfrastructure = 'poste' | 'ligne_bt' | 'ligne_hta' | 'poteau';

export interface InfrastructureProche {
  type: TypeInfrastructure;
  distance: number; // en mètres
  coordonnees: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, unknown>;
}
