/**
 * Types pour le sous-domaine zonage-reglementaire
 */

/**
 * Résultat de la détection zone-urba (PLU)
 */
export interface ResultatZoneUrba {
  present: boolean;
  nombreZones: number;
  typezone?: string;
  libelle?: string;
  destdomi?: string;
}

/**
 * Résultat de la détection secteur-cc (carte communale)
 */
export interface ResultatSecteurCC {
  present: boolean;
  nombreSecteurs: number;
  typesect?: string;
  libelle?: string;
}

/**
 * Informations sur la commune (RNU)
 */
export interface InfoCommune {
  insee: string;
  name: string;
  is_rnu: boolean;
}

/**
 * Résultat complet de l'évaluation du zonage réglementaire
 */
export interface EvaluationZonageReglementaire {
  zoneUrba: ResultatZoneUrba | null;
  secteurCC: ResultatSecteurCC | null;
  commune: InfoCommune | null;
  zonageFinal: string;
}
