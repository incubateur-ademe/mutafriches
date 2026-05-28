/**
 * Registre des datasets de référence surveillés.
 *
 * Chaque entrée associe :
 * - un identifiant stable pour l'UI (`key`)
 * - le libellé français affiché
 * - le pattern SQL `LIKE` utilisé pour retrouver les logs d'import
 *   (le `dataset_name` du découpage administratif inclut la version, d'où le `%`)
 * - le nom de la table cible pour le COUNT(*) actuel
 */
export interface ImportDatasetDefinition {
  key: string;
  label: string;
  datasetNamePattern: string;
  countTable: string;
}

export const IMPORT_DATASETS: readonly ImportDatasetDefinition[] = [
  {
    key: "bpe",
    label: "Base Permanente des Équipements (BPE)",
    datasetNamePattern: "donnees-bpe-2024",
    countTable: "raw_bpe",
  },
  {
    key: "transport-stops",
    label: "Arrêts de transport",
    datasetNamePattern: "transport-stops-france",
    countTable: "raw_transport_stops",
  },
  {
    key: "ademe-sites",
    label: "Sites et sols pollués (ADEME)",
    datasetNamePattern: "ademe-sites-pollues",
    countTable: "raw_ademe_sites_pollues",
  },
  {
    key: "ite-fret",
    label: "Installations terminales embranchées (fret)",
    datasetNamePattern: "ite-fret",
    countTable: "raw_ite_fret",
  },
  {
    key: "decoupage-administratif",
    label: "Découpage administratif (communes / EPCI)",
    datasetNamePattern: "decoupage-administratif-etalab-%",
    countTable: "communes",
  },
] as const;
