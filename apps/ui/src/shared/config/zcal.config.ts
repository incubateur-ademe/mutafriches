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
  // Hauteur de l'iframe de secours : le contenu ZCal mesure ~850px, la modale scrolle
  hauteurSecoursPx: 900,
  // Délai au-delà duquel on considère que le calendrier ne s'affichera pas
  delaiAvantSecoursMs: 6000,
} as const;

/**
 * Reproduit la construction d'URL du script d'embed (`embed.js`) pour les cas où
 * il ne peut plus scanner le DOM : un chemin à un seul segment est préfixé `/emb`.
 */
export function construireUrlIframeZcal(
  hostname = window.location.hostname,
  bookingUrl: string = ZCAL_CONFIG.bookingUrl,
): string {
  const url = new URL(bookingUrl);
  if (url.pathname.split("/").filter(Boolean).length === 1) {
    url.pathname = `/emb${url.pathname}`;
  }
  url.searchParams.set("embed", "1");
  url.searchParams.set("embedType", "inline");
  url.searchParams.set("embedDomain", hostname);
  return url.toString();
}
