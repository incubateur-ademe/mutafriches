import { estOrigineLocale, normaliserOrigines } from "./origine.utils";
import { isDevelopment } from "./environment.utils";

// Nos propres origines (UI standalone et iframe) : seules origines codées en dur.
export const ORIGINES_MUTAFRICHES = [
  "https://mutafriches.beta.gouv.fr",
  "https://mutafriches.incubateur.ademe.dev",
] as const;

// Dashboards de l'incubateur ADEME, qui lisent les KPI publics et le monitoring.
export const ORIGINES_DASHBOARDS_ADEME = [
  "https://stats.incubateur.ademe.fr",
  "https://stats.incubateur.ademe.dev",
] as const;

export interface OriginesConfigurees {
  allowed?: string;
  allowedIntegrators?: string;
}

// Union des origines que CORS peut refléter : les nôtres, les dashboards ADEME et celles
// des variables ALLOWED_ORIGINS / ALLOWED_INTEGRATOR_ORIGINS. Toute origine absente de
// cette liste est de toute façon rejetée par les guards : la restriction CORS ne retire
// aucun accès, elle évite seulement de refléter « * » à n'importe quel site.
export function construireOriginesCors(origines: OriginesConfigurees): string[] {
  const configurees = [origines.allowed, origines.allowedIntegrators]
    .filter((valeur): valeur is string => Boolean(valeur))
    .flatMap((valeur) => valeur.split(","));

  const brutes = [...ORIGINES_MUTAFRICHES, ...ORIGINES_DASHBOARDS_ADEME, ...configurees];

  return [...new Set(normaliserOrigines(brutes))];
}

// Prédicat passé au middleware CORS. Une requête sans Origin (serveur à serveur, curl)
// est laissée passer sans en-tête : CORS ne concerne que les navigateurs.
export function estOrigineCorsAutorisee(
  origine: string | undefined,
  autorisees: string[],
): boolean {
  if (!origine) {
    return true;
  }
  if (isDevelopment() && estOrigineLocale(origine)) {
    return true;
  }
  return autorisees.includes(origine);
}
