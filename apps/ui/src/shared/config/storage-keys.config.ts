/**
 * Clés centralisées de stockage navigateur (localStorage / sessionStorage).
 *
 * Convention pour toute NOUVELLE clé : préfixe "mutafriches" + séparateur underscore,
 * soit `mutafriches_<domaine>_<cle>`. Éviter le ":" (interprété comme placeholder JDBC
 * côté Metabase) et le "-".
 *
 * IMPORTANT : ne jamais renommer une clé déjà déployée — cela orpheline les valeurs
 * stockées chez les utilisateurs (parcours en cours, identifiant visiteur, préférences).
 * Les clés "héritées" ci-dessous ne respectent pas la convention mais sont gelées à ce titre.
 */
export const STORAGE_KEYS = {
  // Tracking / analytics (sessionStorage) — conforme
  SOURCE: "mutafriches_source",
  REF: "mutafriches_ref",

  // Identifiant visiteur anonyme persistant (localStorage) — conforme, cf. ADR-0018
  VISITOR_ID: "mutafriches_visitor_id",

  // État du formulaire (localStorage) — hérité (séparateur "-"), gelé
  FORM_STATE: "mutafriches-form-state",

  // Préférence de fond de carte (localStorage) — hérité (séparateur ":"), gelé
  MAP_LAYER: "mutafriches:map-layer",

  // Sites personnalisés CCI 92 (localStorage) — hérité (sans préfixe), gelé
  CCI92_CUSTOM_SITES: "cci92-custom-sites",
} as const;
