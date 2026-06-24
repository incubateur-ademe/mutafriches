/**
 * Utilitaires pour le panneau de diagnostic debug.
 * Ce panneau n'est visible qu'en environnement de dev ou staging.
 */
import { CRITERES_METADATA } from "@mutafriches/shared-types";

/**
 * Verifie si le panneau debug est active dans l'environnement courant.
 * En production, retourne false et le composant est elimine par tree-shaking.
 */
export function isDebugPanelEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_SHOW_DEBUG_PANEL === "true") return true;
  return false;
}

/**
 * Formate une distance en metres ou kilometres.
 * @param meters - Distance en metres (peut etre null/undefined)
 * @returns Chaine formatee ("123 m", "1,2 km") ou "Non disponible"
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return "Non disponible";
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formate une surface en metres carres ou hectares.
 * @param sqMeters - Surface en metres carres (peut etre null/undefined)
 * @returns Chaine formatee ("1 234 m2", "1,2 ha") ou "Non disponible"
 */
export function formatSurface(sqMeters: number | null | undefined): string {
  if (sqMeters === null || sqMeters === undefined) return "Non disponible";
  if (sqMeters >= 10000) {
    const ha = sqMeters / 10000;
    return `${ha.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ha`;
  }
  return `${Math.round(sqMeters).toLocaleString("fr-FR")} m\u00B2`;
}

/**
 * Formate un booleen en texte francais.
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "Non disponible";
  return value ? "Oui" : "Non";
}

/**
 * Retourne le label francais pour une cle de donnees complementaires,
 * depuis le registre partage des criteres (shared-types).
 */
export function getManualDataLabel(key: string): string {
  return CRITERES_METADATA[key]?.label ?? key;
}

/**
 * Retourne la classe CSS DSFR pour un badge selon la valeur booleenne.
 */
export function getBooleanBadgeClass(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "fr-badge--info";
  return value ? "fr-badge--success" : "fr-badge--warning";
}

/**
 * Retourne la classe CSS DSFR pour un badge de risque (inversee : true = danger).
 */
export function getRiskBadgeClass(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "fr-badge--info";
  return value ? "fr-badge--error" : "fr-badge--success";
}

/**
 * Retourne la couleur de fond pour un indice de mutabilite (0-100).
 */
export function getMutabilityColor(score: number): string {
  if (score >= 70) return "#B8FEC9";
  if (score >= 60) return "#C9FCAC";
  if (score >= 50) return "#FEECC2";
  if (score >= 40) return "#FEDED9";
  return "#FFBDBE";
}

/**
 * Retourne le label de potentiel pour un indice de mutabilite.
 */
export function getMutabilityLabel(score: number): string {
  if (score >= 70) return "Excellent";
  if (score >= 60) return "Tr\u00E8s bon";
  if (score >= 50) return "Bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}
