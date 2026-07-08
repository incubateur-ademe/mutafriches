/**
 * Registre des datasets de référence surveillés.
 *
 * Chaque entrée associe :
 * - un identifiant stable pour l'UI (`key`)
 * - le libellé français affiché
 * - le pattern SQL `LIKE` utilisé pour retrouver les logs d'import
 *   (le `dataset_name` du découpage administratif inclut la version, d'où le `%`)
 * - le nom de la table cible pour le COUNT(*) actuel
 * - l'URL publique de la source officielle (page data.gouv.fr / INSEE / Cerema...)
 */
export interface ImportDatasetDefinition {
  key: string;
  label: string;
  datasetNamePattern: string;
  countTable: string;
  docUrl: string;
}

export const IMPORT_DATASETS: readonly ImportDatasetDefinition[] = [
  {
    key: "bpe",
    label: "Base Permanente des Équipements (BPE)",
    datasetNamePattern: "donnees-bpe-2024",
    countTable: "raw_bpe",
    docUrl: "https://www.insee.fr/fr/metadonnees/source/operation/s2216/bases-donnees-ligne",
  },
  {
    key: "transport-stops",
    label: "Arrêts de transport",
    datasetNamePattern: "transport-stops-france",
    countTable: "raw_transport_stops",
    docUrl: "https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france",
  },
  {
    key: "ademe-sites",
    label: "Sites et sols pollués (ADEME)",
    datasetNamePattern: "ademe-sites-pollues",
    countTable: "raw_ademe_sites_pollues",
    docUrl:
      "https://data.ademe.fr/datasets/srd-ademe/full?p=%2Fdata-fair%2Fembed%2Fdataset%2Fsrd-ademe%2Ftable",
  },
  {
    key: "ite-fret",
    label: "Installations terminales embranchées (fret)",
    datasetNamePattern: "ite-fret",
    countTable: "raw_ite_fret",
    docUrl:
      "https://www.data.gouv.fr/datasets/base-de-donnees-des-installations-terminales-embranchees-fret-en-france-ite-3000",
  },
  {
    key: "lovac",
    label: "Logements vacants (LOVAC)",
    datasetNamePattern: "lovac-communes-%",
    countTable: "raw_lovac",
    docUrl:
      "https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region/",
  },
  {
    key: "decoupage-administratif",
    label: "Découpage administratif (communes / EPCI)",
    datasetNamePattern: "decoupage-administratif-etalab-%",
    countTable: "communes",
    docUrl:
      "https://www.data.gouv.fr/datasets/decoupage-administratif-communal-francais-issu-d-openstreetmap/",
  },
] as const;
