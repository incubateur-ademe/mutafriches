import { SourceEnrichissement } from "../enrichissement";

/** Type de saisie d'un critère : enrichi automatiquement ou saisi manuellement */
export type SaisieCritere = "AUTOMATIQUE" | "MANUELLE";

/** Identifiant des trois sections du récapitulatif du site */
export type SectionRecapitulatifId = "site-bati" | "environnement" | "risques-zonages";

/** Métadonnée descriptive d'un critère (libellé, section, type de saisie, source) */
export interface CritereMetadata {
  /** Clé technique du critère (cohérente avec POIDS_CRITERES) */
  key: string;
  label: string;
  section: SectionRecapitulatifId;
  saisie: SaisieCritere;
  /** Poids du critère dans l'algorithme (mirroir de POIDS_CRITERES, gardé par un test côté API) */
  poids: number;
  /** Source d'enrichissement — uniquement pour les critères AUTOMATIQUE */
  source?: SourceEnrichissement;
  /** Ordre d'affichage global */
  ordre: number;
}

/**
 * Métadonnée d'une donnée informative : enrichie et affichée dans le récapitulatif,
 * mais absente de l'algorithme (ni poids, ni ligne de matrice, ni effet sur la fiabilité).
 *
 * Registre volontairement distinct de CRITERES_METADATA, qui est verrouillé sur
 * POIDS_CRITERES par un garde-fou côté API : une donnée sans poids n'y a pas sa place.
 */
export interface InformationMetadata {
  key: string;
  label: string;
  section: SectionRecapitulatifId;
  source: SourceEnrichissement;
  /** Ordre d'affichage, appliqué après les critères de la même section */
  ordre: number;
}

/** Critère ou donnée informative résolu, prêt pour l'affichage */
export interface RecapitulatifCritere {
  key: string;
  label: string;
  valeurAffichee: string;
  saisie: SaisieCritere;
  source?: SourceEnrichissement;
  /** Libellé court de la source pour le badge (ex : "Cadastre") */
  sourceLabel?: string;
  /** Donnée informative : affichée mais non prise en compte dans le calcul */
  informatif?: boolean;
}

/** Section regroupant des critères résolus */
export interface RecapitulatifSection {
  id: SectionRecapitulatifId;
  titre: string;
  criteres: RecapitulatifCritere[];
}

/** Titres affichés des sections */
export const SECTIONS_RECAPITULATIF_TITRES: Record<SectionRecapitulatifId, string> = {
  "site-bati": "Le site et son bâti",
  environnement: "L'environnement du site",
  "risques-zonages": "Les risques et zonages du site",
};
