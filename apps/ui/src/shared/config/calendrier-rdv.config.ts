// Calendrier de prise de rendez-vous : instance Cal.com de l'incubateur ADEME (ADR-0056).
// Surchargeable par `VITE_CALENDRIER_RDV_URL` (autre calendrier ou autre instance Cal.com).
const CALENDRIER_RDV_URL_PAR_DEFAUT =
  "https://rdv.incubateur.ademe.fr/celia.vermicelli/45min?overlayCalendar=true";

export const CALENDRIER_RDV_CONFIG = {
  bookingUrl:
    (import.meta.env.VITE_CALENDRIER_RDV_URL as string | undefined) ??
    CALENDRIER_RDV_URL_PAR_DEFAUT,
  // Délai au-delà duquel on considère que le calendrier ne s'affichera pas
  delaiAvantSecoursMs: 6000,
} as const;

export interface ParametresEmbedCalendrier {
  origine: string;
  scriptUrl: string;
  // Chemin du calendrier sans barre initiale, tel qu'attendu par l'embed Cal.com
  calLink: string;
  config: Record<string, string>;
}

// Dérive les paramètres de l'embed de la seule URL de réservation : le script est servi par l'instance.
export function construireParametresEmbed(
  bookingUrl: string = CALENDRIER_RDV_CONFIG.bookingUrl,
): ParametresEmbedCalendrier {
  const url = new URL(bookingUrl);
  return {
    origine: url.origin,
    scriptUrl: `${url.origin}/embed/embed.js`,
    calLink: url.pathname.replace(/^\/+|\/+$/g, ""),
    config: {
      ...Object.fromEntries(url.searchParams),
      layout: "month_view",
      // L'UI est figée en thème clair (`data-fr-scheme="light"`)
      theme: "light",
    },
  };
}
