/**
 * Configuration du calendrier ZCal embarqué (prise de rendez-vous multisites).
 *
 * L'URL est surchargeable via `VITE_ZCAL_URL` pour différencier les environnements
 * ou changer de calendrier sans modifier le code. À défaut, le calendrier de l'équipe
 * Mutafriches est utilisé.
 */
const ZCAL_URL_PAR_DEFAUT = "https://zcal.co/i/D0NODYSy";

export const ZCAL_CONFIG = {
  // Paramètres requis par ZCal pour le rendu en iframe
  embedUrl: `${import.meta.env.VITE_ZCAL_URL ?? ZCAL_URL_PAR_DEFAUT}?embed=1&embedType=iframe`,
} as const;
