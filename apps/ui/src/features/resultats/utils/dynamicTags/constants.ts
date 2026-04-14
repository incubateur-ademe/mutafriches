// ============================================================================
// SEUILS DE CALCUL (alignés sur algorithme.config.ts)
// ============================================================================

/** Seuil pour considérer une parcelle comme "grande" en m² */
export const SEUIL_GRANDE_PARCELLE = 10000;

/** Seuil pour considérer une emprise bâtie comme "faible" en m² */
export const SEUIL_EMPRISE_BATI_FAIBLE = 500;

/** Distance maximale pour considérer les transports en commun "à proximité" en mètres */
export const SEUIL_DISTANCE_TC_PROCHE = 500;

/** Distance maximale pour considérer le raccordement électrique accessible en mètres */
export const SEUIL_DISTANCE_RACCORDEMENT_ELEC = 500;

// ============================================================================
// CONSTANTES D'AFFICHAGE DES TAGS
// ============================================================================

/** Seuil minimum de poids pondéré pour afficher un tag */
export const SEUIL_POIDS_PONDERE_TAG = 1;

/** Nombre maximum de tags affichés par usage */
export const MAX_TAGS_PAR_USAGE = 5;
