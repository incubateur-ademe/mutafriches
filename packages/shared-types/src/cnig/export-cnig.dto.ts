/** Contrat de `POST /api/partenaires/:slug/export` (export CNIG de tous les sites). */

import type { UsageType } from "../evaluation/enums/usage.enum";
import type { DonneesComplementairesInputDto } from "../evaluation/dto/donnees-complementaires-input.dto";

/** Formats d'échange produits. Le CSV est le fichier validable (TableSchema CNIG). */
export type FormatExportCnig = "csv" | "geojson";

/**
 * Mutabilité résumée d'un site, transmise par l'UI pour les colonnes hors standard.
 * Volontairement compacte : le détail par critère n'a pas sa place dans un export CNIG.
 */
export interface MutabiliteResumeeExportDto {
  /** Indice 0-100 par usage. */
  indices: Partial<Record<UsageType, number>>;
  /** Usage classé premier. */
  usagePrioritaire?: UsageType;
  /** Note de fiabilité sur 10. */
  fiabilite?: number;
}

export interface ExportCnigInputDto {
  format: FormatExportCnig;
  /** Ajoute les colonnes `mf_*`, hors standard. Le fichier n'est alors plus conforme. */
  inclureMutabilite?: boolean;
  /**
   * Connaissance terrain saisie par l'utilisateur, par `idtup`. Stockée localement dans son
   * navigateur (ADR-0021) : elle transite ici pour l'export, sans être persistée côté serveur.
   * Seuls les sites effectivement qualifiés sont transmis.
   */
  connaissanceTerrain?: Record<string, DonneesComplementairesInputDto>;
  /** Mutabilité calculée localement, par `idtup`. Ignorée si `inclureMutabilite` est faux. */
  mutabilite?: Record<string, MutabiliteResumeeExportDto>;
  /** Version d'algorithme utilisée pour les calculs transmis. */
  versionAlgorithme?: string;
}

/** Un site écarté de l'export, et pourquoi. */
export interface SiteEcarteExportCnig {
  idtup: string;
  commune?: string;
  motif: string;
}

/** Métadonnées renvoyées avec le fichier (en-tête `X-Export-Rapport`). */
export interface RapportExportCnig {
  sitesTotal: number;
  sitesExportes: number;
  sitesEcartes: SiteEcarteExportCnig[];
}
