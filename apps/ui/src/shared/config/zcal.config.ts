/**
 * Configuration du calendrier ZCal embarqué (prise de rendez-vous multisites).
 *
 * L'URL est surchargeable via `VITE_ZCAL_URL` pour différencier les environnements
 * ou changer de calendrier sans modifier le code. À défaut, le calendrier de l'équipe
 * Mutafriches est utilisé.
 *
 * On expose l'URL de réservation brute : le script d'embed ZCal ajoute lui-même les
 * paramètres `embed=1&embedType=inline` et redimensionne l'iframe à la hauteur réelle
 * du contenu (un iframe statique tronquait le calendrier).
 */
const ZCAL_URL_PAR_DEFAUT = "https://zcal.co/i/D0NODYSy";

export const ZCAL_CONFIG = {
  bookingUrl: import.meta.env.VITE_ZCAL_URL ?? ZCAL_URL_PAR_DEFAUT,
  // Script officiel d'embed responsive (auto-dimensionnement via postMessage)
  embedScriptUrl: "https://static.zcal.co/embed/v1/embed.js",
} as const;
