import { hotesIntegrateursIframe } from "@mutafriches/shared-types";
import { estOrigineLocale, normaliserOrigine, normaliserOrigines } from "./origine.utils";
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
}

// Origines fixes que CORS peut refléter : les nôtres, les dashboards ADEME et celles de la
// variable ALLOWED_ORIGINS. Les intégrateurs déclarés (table `integrateurs`, ADR-0055)
// s'y ajoutent à chaque requête, cf. estOrigineCorsDeclaree.
export function construireOriginesCors(origines: OriginesConfigurees): string[] {
  const configurees = origines.allowed ? origines.allowed.split(",") : [];
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

// Complète la liste fixe par le registre des intégrateurs. Une origine refusée ici le serait
// aussi par le guard : la restriction CORS ne retire aucun accès, elle évite de refléter « * ».
export async function estOrigineCorsDeclaree(
  origine: string | undefined,
  autorisees: string[],
  estDeclaree: (origine: string) => Promise<boolean>,
): Promise<boolean> {
  if (!origine || estOrigineCorsAutorisee(origine, autorisees)) {
    return true;
  }
  try {
    return await estDeclaree(normaliserOrigine(origine) ?? origine);
  } catch {
    return false;
  }
}

// Sources CSP `frame-ancestors` : qui a le droit d'embarquer l'UI en iframe. Nous-mêmes, les
// intégrateurs iframe du registre partagé (hôtes nus : tout schéma) et les origines fixes.
// Une origine déclarée librement pour l'API n'y figure pas : elle ne doit pas suffire à nous
// embarquer (ADR-0055). Les navigateurs ignorent alors X-Frame-Options.
export function construireFrameAncestors(origines: OriginesConfigurees): string[] {
  return [
    ...new Set(["'self'", ...hotesIntegrateursIframe(), ...construireOriginesCors(origines)]),
  ];
}
