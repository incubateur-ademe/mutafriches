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
 * - le script d'import (nom du fichier compilé dans `dist/src/scripts`), lancé au déploiement
 *   par `import-all` quand la table est vide (ADR-0050)
 * - l'origine de la donnée : `fichier` (GeoJSON/CSV commité, sans réseau) ou `reseau`
 *   (téléchargement à l'exécution)
 *
 * Une nouvelle source importée = une entrée ici, sans quoi elle n'est jamais importée au
 * déploiement (`imports.registry.spec.ts` le vérifie).
 */
export interface ImportDatasetDefinition {
  key: string;
  label: string;
  datasetNamePattern: string;
  countTable: string;
  docUrl: string;
  script: string;
  source: "fichier" | "reseau";
}

export const IMPORT_DATASETS: readonly ImportDatasetDefinition[] = [
  {
    key: "bpe",
    label: "Base Permanente des Équipements (BPE)",
    datasetNamePattern: "donnees-bpe-2024",
    countTable: "raw_bpe",
    docUrl: "https://www.insee.fr/fr/metadonnees/source/operation/s2216/bases-donnees-ligne",
    script: "import-bpe",
    source: "fichier",
  },
  {
    key: "transport-stops",
    label: "Arrêts de transport",
    datasetNamePattern: "transport-stops-france",
    countTable: "raw_transport_stops",
    docUrl: "https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france",
    script: "import-transport-stops",
    source: "reseau",
  },
  {
    key: "ademe-sites",
    label: "Sites et sols pollués (ADEME)",
    datasetNamePattern: "ademe-sites-pollues",
    countTable: "raw_ademe_sites_pollues",
    docUrl:
      "https://data.ademe.fr/datasets/srd-ademe/full?p=%2Fdata-fair%2Fembed%2Fdataset%2Fsrd-ademe%2Ftable",
    script: "import-ademe-sites",
    source: "fichier",
  },
  {
    key: "ite-fret",
    label: "Installations terminales embranchées (fret)",
    datasetNamePattern: "ite-fret",
    countTable: "raw_ite_fret",
    docUrl:
      "https://www.data.gouv.fr/datasets/base-de-donnees-des-installations-terminales-embranchees-fret-en-france-ite-3000",
    script: "import-ite-fret",
    source: "fichier",
  },
  {
    key: "lovac",
    label: "Logements vacants (LOVAC)",
    datasetNamePattern: "lovac-communes-%",
    countTable: "raw_lovac",
    docUrl:
      "https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region/",
    script: "import-lovac",
    source: "reseau",
  },
  {
    key: "zonage-abc",
    label: "Zonage ABC (tension du marché du logement)",
    datasetNamePattern: "zonage-abc-communes-%",
    countTable: "raw_zonage_abc",
    docUrl: "https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-abc",
    script: "import-zonage-abc",
    source: "reseau",
  },
  {
    key: "reseaux-chaleur",
    label: "Réseaux de chaleur urbains",
    datasetNamePattern: "reseaux-chaleur",
    countTable: "raw_reseaux_chaleur",
    docUrl: "https://www.data.gouv.fr/dataservices/api-france-chaleur-urbaine",
    script: "import-reseaux-chaleur",
    source: "reseau",
  },
  {
    key: "icu",
    label: "Îlots de chaleur urbain (ICU)",
    datasetNamePattern: "icu",
    countTable: "raw_icu",
    docUrl:
      "https://www.data.gouv.fr/datasets/cartographie-nationale-des-indicateurs-lies-a-lilot-de-chaleur-urbain",
    script: "import-icu",
    source: "fichier",
  },
  {
    key: "qpv",
    label: "Quartiers prioritaires de la ville (QPV)",
    datasetNamePattern: "qpv",
    countTable: "raw_qpv",
    docUrl:
      "https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv",
    script: "import-qpv",
    source: "fichier",
  },
  {
    key: "zones-contrainte-enr",
    label: "Zones de contrainte réseau pour les projets EnR (Enedis)",
    datasetNamePattern: "zones-contrainte-enr",
    countTable: "raw_zones_contrainte_enr",
    docUrl: "https://observatoire.enedis.fr/services/carte-zones-contrainte-projets-enr",
    script: "import-zones-contrainte-enr",
    source: "fichier",
  },
  {
    key: "zae",
    label: "Zones d'activité économique (Cerema, Fusac)",
    datasetNamePattern: "zae",
    countTable: "raw_zae",
    docUrl: "https://datafoncier.cerema.fr/fusac",
    script: "import-zae",
    source: "fichier",
  },
  {
    key: "decoupage-administratif",
    label: "Découpage administratif (communes / EPCI)",
    datasetNamePattern: "decoupage-administratif-etalab-%",
    countTable: "communes",
    docUrl:
      "https://www.data.gouv.fr/datasets/decoupage-administratif-communal-francais-issu-d-openstreetmap/",
    script: "import-epci-communes",
    source: "reseau",
  },
] as const;
