/**
 * Statut du dernier import connu pour un dataset.
 *
 * - "success" : import terminé avec succès
 * - "failed" : import terminé en erreur
 * - "running" : import en cours
 * - "never" : aucun import n'a jamais été enregistré
 */
export type ImportStatus = "success" | "failed" | "running" | "never";

/**
 * Statut d'un dataset de référence importé en base.
 */
export interface ImportStatusItem {
  /** Identifiant stable pour l'UI (ex: "bpe") */
  key: string;
  /** Libellé français affiché */
  label: string;
  /** Statut du dernier import connu */
  status: ImportStatus;
  /** Nombre de lignes actuellement présentes en base */
  rowsInDb: number;
  /** Nombre de lignes importées lors du dernier import (null si jamais importé) */
  rowsImported: number | null;
  /** Date du dernier import (ISO8601, null si jamais importé) */
  lastImportAt: string | null;
  /** Chemin ou URL du fichier source utilisé */
  sourcePath: string | null;
  /** Taille du fichier source en octets */
  fileSizeBytes: number | null;
}

/**
 * Réponse de l'endpoint GET /api/import-status.
 */
export interface ImportStatusOutput {
  /** Date de génération de la réponse (ISO8601) */
  generatedAt: string;
  /** Liste des datasets surveillés */
  imports: ImportStatusItem[];
  /** Vrai si au moins un dataset a 0 ligne en base */
  hasEmptyImport: boolean;
  /** Vrai si au moins un dataset est en erreur */
  hasFailedImport: boolean;
}
