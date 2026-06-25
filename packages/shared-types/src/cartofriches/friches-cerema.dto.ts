/**
 * Données d'une friche issue de l'API Cartofriches du Cerema.
 *
 * Source : API Données foncières du Cerema, endpoint libre
 * `GET /cartofriches/friches/{site_id}/?fields=all`.
 *
 * Le paramètre `fields=all` renvoie davantage de champs que le schéma OpenAPI public :
 * les indices de mutabilité par usage (`p_*`, souvent null en accès libre) et plusieurs
 * champs sources non documentés (`distance_ite_bon`, `distance_ite_mauvais`, `site_zaer`,
 * `zonage_enviro`, `monuhisto`, ...).
 *
 * Seuls les champs exploités pour la comparaison avec Mutafriches sont typés explicitement ;
 * les autres restent accessibles via l'index signature.
 */
export interface FrichesCerema {
  // Identité
  site_id: string;
  site_nom: string | null;
  site_type: string | null;
  site_statut: string | null;
  site_adresse: string | null;
  comm_nom: string | null;
  comm_insee: string | null;
  dep: string | null;

  // Unité foncière
  unite_fonciere_surface: number | null;
  /** Liste des références cadastrales, sérialisée par l'API (ex: "['49353000AC0628']") */
  unite_fonciere_refcad: string | null;
  site_surface: number | null;

  // Bâti
  bati_surface: number | null;
  emprise_sol_bati: string | null;
  bati_etat: string | null;
  bati_pollution: string | null;
  bati_patrimoine: string | null;

  // Pollution
  site_numero_basol: string | null;
  site_numero_basias: string | null;
  sol_pollution_existe: string | null;

  // Zonages
  urba_zone_type: string | null;
  urba_zone_lib: string | null;
  zonage_enviro: string | null;
  monuhisto: string | null;
  monuhisto500: string | null;

  // Propriété (peut arriver éclatée caractère par caractère côté API)
  proprio_type: string[] | string | null;
  proprio_personne: string | null;

  // Énergies renouvelables
  site_zaer: string | null;

  // Desserte / ITE fret (distances en km)
  distance_ite_bon: number | null;
  distance_ite_mauvais: number | null;
  desserte_distance_ferroviaire: number | null;

  // Usage / contexte
  site_vocadomi: string | null;
  zone_activites: string | null;

  // Indices de mutabilité par usage (souvent null en accès libre — version beta)
  p_residentiel: number | null;
  p_equipement: number | null;
  p_culturel: number | null;
  p_tertiaire: number | null;
  p_industriel: number | null;
  p_renaturation: number | null;
  p_pv: number | null;

  [key: string]: unknown;
}

/**
 * Résultat de la recherche d'une friche Cartofriches par identifiant cadastral.
 */
export interface CartofrichesRechercheResult {
  /** Une friche a été trouvée pour l'identifiant demandé */
  trouve: boolean;
  /** Friche correspondante (champs propriété et refcad nettoyés), null si non trouvée */
  friche: FrichesCerema | null;
  /** Références cadastrales de la friche trouvée (parsées depuis unite_fonciere_refcad) */
  refcadParsees: string[];
  /** Nombre de friches de la commune examinées pour le matching */
  nbCandidats: number;
  /** URL de la fiche publique Cartofriches */
  ficheUrl: string | null;
  source: string;
  responseTimeMs?: number;
  erreur?: string;
}
