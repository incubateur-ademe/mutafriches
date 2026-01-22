/**
 * Configuration des champs de la section "Risques"
 *
 * Note: Pour cette étape, les données sont principalement issues de l'enrichissement
 * automatique (GeoRisques, API Carto, etc.). Il n'y a pas de champs à saisir
 * manuellement pour le moment.
 *
 * Les données affichées sont:
 * - Risques technologiques (via GeoRisques)
 * - Risques naturels (via GeoRisques)
 * - Zonage environnemental (via API Carto Nature)
 * - Zonage urbanistique (via API Carto GPU)
 * - Zonage patrimonial (via API Carto)
 */

/**
 * Configuration des informations enrichies affichées dans l'étape Risques
 */
export const RISQUES_INFO_CONFIG = {
  risquesTechno: {
    id: "risques-technologiques",
    label: "Présence de risques technologiques",
    source: "API GéoRisques",
    sourceUrl: "https://georisques.gouv.fr/doc-api",
  },

  risquesNaturels: {
    id: "risques-naturels",
    label: "Présence de risques naturels",
    source: "API GéoRisques",
    sourceUrl: "https://georisques.gouv.fr/doc-api",
    note: "En l'absence de la numérisation des plans de prévention des risques, cette donnée est susceptible d'être faussée",
  },

  zonageEnviro: {
    id: "zonage-environnemental",
    label: "Type de zonage environnemental",
    source: "API Carto Nature (IGN)",
    sourceUrl: "https://apicarto.ign.fr/api/doc/",
  },

  zonageUrba: {
    id: "zonage-urbanistique",
    label: "Zonage réglementaire",
    source: "API Carto GPU (IGN)",
    sourceUrl: "https://apicarto.ign.fr/api/doc/",
  },

  zonagePatrimonial: {
    id: "zonage-patrimonial",
    label: "Type de zonage patrimonial",
    source: "API Carto (IGN)",
    sourceUrl: "https://apicarto.ign.fr/api/doc/",
  },
} as const;

/**
 * Liste des infos risques sous forme de tableau
 */
export const RISQUES_INFO_LIST = Object.values(RISQUES_INFO_CONFIG);
