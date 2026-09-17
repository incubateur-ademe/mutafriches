/**
 * Modèle du standard CNIG Friches (v2023-12 rev. 2025-12).
 *
 * Source de vérité : TableSchema officiel `cnigfr/schema-friches` v1.0.6
 * (https://schema.data.gouv.fr/cnigfr/schema-friches/) — 51 colonnes, clé primaire `site_id`.
 */

/** Valeurs conventionnelles communes à tous les types énumérés (standard §3.4). */
export const CNIG_INCONNU = "inconnu";
export const CNIG_AUTRE = "autre";
export const CNIG_SANS_OBJET = "sans objet";

/** Séparateur des champs à valeurs multiples (standard §4.2). */
export const CNIG_SEPARATEUR_VALEURS = "|";

/** Version du standard reprise dans la documentation et les métadonnées d'export. */
export const CNIG_VERSION_STANDARD = "v2023-12 rev2025-12";

/**
 * Une friche au format CNIG. `null` = colonne présente mais non renseignée.
 * Les champs non nullables sont ceux dont le remplissage est obligatoire (standard §3.3).
 */
export interface FricheCnig {
  // Identité du site
  site_id: string;
  site_nom: string;
  site_type: string;
  site_adresse: string | null;
  site_identif_date: string;
  site_actu_date: string;
  site_url: string | null;
  site_ademe_url: string | null;
  site_securite: string | null;
  site_occupation: string | null;
  site_statut: string | null;
  site_projet_url: string | null;
  site_reconv_annee: string | null;
  site_reconv_type: string | null;

  // Activité passée
  activite_libelle: string | null;
  activite_code: string | null;
  activite_fin_annee: string | null;

  // Commune
  comm_nom: string;
  comm_insee: string;

  // Bâti
  bati_type: string | null;
  bati_nombre: number | null;
  bati_surface: number | null;
  bati_pollution: string | null;
  bati_vacance: string | null;
  bati_patrimoine: string | null;
  bati_etat: string | null;
  local_ancien_annee: string | null;
  local_recent_annee: string | null;

  // Propriété
  proprio_type: string | null;
  proprio_personne: string | null;
  proprio_nom: string | null;

  // Pollution des sols
  sol_pollution_annee: string | null;
  sol_pollution_existe: string | null;
  sol_pollution_origine: string | null;
  sol_pollution_commentaire: string | null;
  sol_depollution_fiche: string | null;

  // Unité foncière
  unite_fonciere_surface: number | null;
  unite_fonciere_refcad: string | null;

  // Urbanisme
  urba_zone_type: string | null;
  urba_zone_lib: string | null;
  urba_zone_formdomi: string | null;
  urba_zaer: string;
  urba_doc_type: string | null;

  // Desserte
  desserte_distance: string | null;
  desserte_commentaire: string | null;

  // Source de la donnée
  source_nom: string;
  source_url: string | null;
  source_producteur: string | null;
  source_contact: string | null;

  // Géométries (WKT)
  geompoint: string;
  geomsurf: string | null;
}

/** Ordre des colonnes du fichier d'échange (identique au TableSchema v1.0.6). */
export const COLONNES_FRICHE_CNIG: readonly (keyof FricheCnig)[] = [
  "site_id",
  "site_nom",
  "site_type",
  "site_adresse",
  "site_identif_date",
  "site_actu_date",
  "site_url",
  "site_ademe_url",
  "site_securite",
  "site_occupation",
  "site_statut",
  "site_projet_url",
  "site_reconv_annee",
  "site_reconv_type",
  "activite_libelle",
  "activite_code",
  "activite_fin_annee",
  "comm_nom",
  "comm_insee",
  "bati_type",
  "bati_nombre",
  "bati_surface",
  "bati_pollution",
  "bati_vacance",
  "bati_patrimoine",
  "bati_etat",
  "local_ancien_annee",
  "local_recent_annee",
  "proprio_type",
  "proprio_personne",
  "proprio_nom",
  "sol_pollution_annee",
  "sol_pollution_existe",
  "sol_pollution_origine",
  "sol_pollution_commentaire",
  "sol_depollution_fiche",
  "unite_fonciere_surface",
  "unite_fonciere_refcad",
  "urba_zone_type",
  "urba_zone_lib",
  "urba_zone_formdomi",
  "urba_zaer",
  "urba_doc_type",
  "desserte_distance",
  "desserte_commentaire",
  "source_nom",
  "source_url",
  "source_producteur",
  "source_contact",
  "geompoint",
  "geomsurf",
] as const;

/**
 * Colonnes Mutafriches, hors standard CNIG (le MCD autorise l'extension par couples
 * clé-valeur). Ajoutées seulement sur demande explicite : le fichier par défaut reste
 * strictement conforme au TableSchema.
 */
export interface ExtensionMutafriches {
  mf_indice_residentiel: number | null;
  mf_indice_equipements: number | null;
  mf_indice_culture: number | null;
  mf_indice_tertiaire: number | null;
  mf_indice_industrie: number | null;
  mf_indice_renaturation: number | null;
  mf_indice_photovoltaique: number | null;
  mf_usage_prioritaire: string | null;
  mf_fiabilite: number | null;
  mf_version_algorithme: string | null;
}

/** Ordre des colonnes de l'extension, ajoutées en fin de fichier. */
export const COLONNES_EXTENSION_MUTAFRICHES: readonly (keyof ExtensionMutafriches)[] = [
  "mf_indice_residentiel",
  "mf_indice_equipements",
  "mf_indice_culture",
  "mf_indice_tertiaire",
  "mf_indice_industrie",
  "mf_indice_renaturation",
  "mf_indice_photovoltaique",
  "mf_usage_prioritaire",
  "mf_fiabilite",
  "mf_version_algorithme",
] as const;

/** Une ligne d'export : friche CNIG, éventuellement étendue des indices Mutafriches. */
export type LigneExportCnig = FricheCnig & Partial<ExtensionMutafriches>;
