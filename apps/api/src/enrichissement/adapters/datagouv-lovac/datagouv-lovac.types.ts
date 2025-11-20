/**
 * Types pour l'API tabulaire data.gouv.fr - Données LOVAC
 * https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region/
 */

/**
 * Structure d'une ligne de données LOVAC retournée par l'API
 */
export interface LovacCommuneRow {
  CODGEO_25: string; // Code géographique INSEE de la commune (ex: "49007")
  LIBGEO_25: string; // Nom de la commune (ex: "Angers")
  DEP: string; // Code département (ex: "49")
  LIB_DEP: string; // Nom du département (ex: "Maine-et-Loire")
  REG: string; // Code région (ex: "52")
  LIB_REG: string; // Nom de la région (ex: "Pays de la Loire")
  EPCI_25: string; // Code EPCI (ex: "244900015")
  LIB_EPCI_25: string; // Nom de l'EPCI

  // Données logements totaux du parc privé
  pp_total_20?: string;
  pp_total_21?: string;
  pp_total_22?: string;
  pp_total_23?: string;
  pp_total_24?: string;

  // Données logements vacants du parc privé
  pp_vacant_20?: string;
  pp_vacant_21?: string;
  pp_vacant_22?: string;
  pp_vacant_23?: string;
  pp_vacant_24?: string;
  pp_vacant_25?: string;

  // Données logements vacants depuis plus de 2 ans
  pp_vacant_plus_2ans_20?: string;
  pp_vacant_plus_2ans_21?: string;
  pp_vacant_plus_2ans_22?: string;
  pp_vacant_plus_2ans_23?: string;
  pp_vacant_plus_2ans_24?: string;
  pp_vacant_plus_2ans_25?: string;
}

/**
 * Métadonnées de pagination
 */
export interface DatagouvApiMeta {
  page: number;
  page_size: number;
  total: number;
}

/**
 * Liens de pagination
 */
export interface DatagouvApiLinks {
  profile: string;
  swagger: string;
  next: string | null;
  prev: string | null;
}

/**
 * Réponse complète de l'API tabulaire data.gouv.fr
 */
export interface DatagouvLovacResponse {
  data: LovacCommuneRow[];
  meta: DatagouvApiMeta;
  links: DatagouvApiLinks;
}

/**
 * Paramètres de requête pour l'API LOVAC
 */
export interface LovacQueryParams {
  codeInsee?: string; // Code INSEE de la commune (CODGEO_25__exact)
  nomCommune?: string; // Nom de la commune (LIBGEO_25__exact)
  page?: number;
  page_size?: number;
}

/**
 * Données LOVAC enrichies et calculées
 */
export interface LovacData {
  codeInsee: string;
  commune: string;
  departement: string;
  region: string;

  // Logements totaux (millésime le plus récent disponible)
  nombreLogementsTotal: number | null;

  // Logements vacants (millésime le plus récent disponible)
  nombreLogementsVacants: number | null;

  // Taux de logements vacants calculé (en pourcentage)
  tauxLogementsVacants: number | null;

  // Logements vacants depuis plus de 2 ans
  nombreLogementsVacantsPlus2ans: number | null;

  // Année du millésime utilisé
  millesime: number;
}
