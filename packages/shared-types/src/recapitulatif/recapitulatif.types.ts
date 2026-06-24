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
  /** Source d'enrichissement — uniquement pour les critères AUTOMATIQUE */
  source?: SourceEnrichissement;
  /** Ordre d'affichage global */
  ordre: number;
}

/** Critère résolu, prêt pour l'affichage */
export interface RecapitulatifCritere {
  key: string;
  label: string;
  valeurAffichee: string;
  saisie: SaisieCritere;
  source?: SourceEnrichissement;
  /** Libellé court de la source pour le badge (ex : "Cadastre") */
  sourceLabel?: string;
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
