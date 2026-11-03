/** Contrat de `GET /api/attributaire/sites` : sites qualifiés ou évalués d'une commune (ADR-0053). */

import type { UsageType } from "../evaluation/enums/usage.enum";
import type { ChampComplementaireRequis } from "../evaluation/utils/donnees-complementaires.validation";

export type FormatTableAttributaire = "json" | "geojson";

export const FORMATS_TABLE_ATTRIBUTAIRE: readonly FormatTableAttributaire[] = ["json", "geojson"];

export const AVERTISSEMENT_SAISIE_DECLARATIVE =
  "Les critères saisis sont déclaratifs : renseignés par les utilisateurs de Mutafriches, ils " +
  "n'ont pas été vérifiés. Sans saisie, la mutabilité est calculée avec « Je ne sais pas » pour " +
  "chaque critère manuel.";

export type CriteresSaisis = Partial<Record<ChampComplementaireRequis, string>>;

export interface MutabiliteAttributaire {
  /** Indice 0-100 par usage, recalculé avec la version courante de l'algorithme. */
  indices: Partial<Record<UsageType, number>>;
  /** Premier usage du classement, hors usages exclus (sauf si tous le sont). */
  usagePrioritaire?: UsageType;
  usagesExclus: UsageType[];
  fiabilite: { note: number; niveau: string };
}

export interface SiteAttributaireDto {
  /** Parcelles normalisées, triées et jointes par des virgules. */
  cleSite: string;
  parcelles: string[];
  nombreParcelles: number;
  parcellePredominante?: string;
  codeInsee: string;
  commune?: string;
  /** Nom et slug du partenaire, pour un site d'inventaire partenaire. */
  nom?: string;
  partenaire?: string;
  centroide?: { latitude: number; longitude: number };
  /** Critères enrichis automatiquement, valeurs du DTO d'enrichissement (`null` = recherche sans résultat). */
  criteresAutomatiques: Record<string, unknown>;
  dateEnrichissement: string;
  /** Vrai quand `criteresSaisis` vient d'une saisie utilisateur, non vérifiée. */
  saisieDeclarative: boolean;
  criteresSaisis: CriteresSaisis | null;
  dateSaisie?: string;
  /** Évaluations enregistrées pour ce même ensemble de parcelles (hors cache et démonstration). */
  nombreEvaluations: number;
  mutabilite: MutabiliteAttributaire;
  versionAlgorithme: string;
  dateMiseAJour: string;
}

export interface TableAttributaireOutputDto {
  codeInsee: string;
  commune?: string;
  dateGeneration: string;
  avertissement: string;
  nombreSites: number;
  sites: SiteAttributaireDto[];
}
