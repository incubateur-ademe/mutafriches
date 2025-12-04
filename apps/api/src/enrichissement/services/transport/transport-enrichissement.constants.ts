/**
 * Constantes pour l'enrichissement du domaine Transport
 */

/**
 * Seuil de distance pour déterminer si une parcelle est en centre-ville
 * Unité : mètres
 */
export const SEUIL_CENTRE_VILLE_M = 1000;

/**
 * Rayon de recherche pour trouver les voies de grande circulation
 * Unité : mètres (15km = 15000m)
 */
export const RAYON_RECHERCHE_AUTOROUTE_M = 15000;

/**
 * Rayon de recherche pour les transports en commun (en metres)
 *
 * Defini a 2km car :
 * - L'Excel utilise 3 seuils : <500m, 500m-1km, >1km
 * - 2km permet de capturer meme les cas "eloignes"
 * - Au-dela de 2km, on considere qu'il n'y a pas de transport accessible a pied
 */
export const RAYON_RECHERCHE_TRANSPORT_M = 2000;

/**
 * Seuils de distance pour la categorisation transport en commun
 * Utilises par le calculator pour l'algorithme de mutabilite
 */
export const SEUILS_TRANSPORT_COMMUN = {
  /** Moins de 500m : tres bien desservi */
  PROCHE: 500,
  /** Entre 500m et 1km : correctement desservi */
  MOYEN: 1000,
  /** Au-dela de 1km : mal desservi */
} as const;
