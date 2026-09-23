/**
 * Types métier pour le service Enedis
 */

/**
 * Résultat de calcul de distance de raccordement électrique
 */
export interface EnedisRaccordement {
  /** Distance en mètres jusqu'au plus proche point de raccordement. null = aucune
   * infrastructure trouvée dans les rayons de recherche (5 km postes, 500 m lignes BT aériennes et souterraines) */
  distance: number | null;
  /** Type de raccordement : Basse Tension ou Haute Tension */
  type: "BT" | "HTA";
  /** Estimation de la capacité disponible */
  capaciteDisponible: boolean;
  /** Informations sur le poste électrique le plus proche */
  posteProche?: {
    nom: string;
    commune: string;
    coordonnees: {
      latitude: number;
      longitude: number;
    };
  };
  /** Informations sur l'infrastructure la plus proche */
  infrastructureProche?: {
    type: "poste" | "ligne_bt" | "poteau";
    distance: number; // en mètres
    tension: "BT" | "HTA";
  };
}
