export enum TypeEvenement {
  VISITE = "visite",
  ENRICHISSEMENT_TERMINE = "enrichissement_termine",

  // Pages de qualification
  QUALIFICATION_SITE = "qualification_site",
  QUALIFICATION_ENVIRONNEMENT = "qualification_environnement",
  QUALIFICATION_RISQUES = "qualification_risques",

  // Resultats d'evaluation
  RESULTATS_MUTABILITE = "resultats_mutabilite",

  // Deprecated
  DONNEES_COMPLEMENTAIRES_SAISIES = "donnees_complementaires_saisies",
  EVALUATION_TERMINEE = "evaluation_terminee",

  // Feedback sur résultats
  FEEDBACK_PERTINENCE_CLASSEMENT = "feedback_pertinence_classement",

  // Sélection multi-parcelle
  PARCELLE_AJOUTEE = "parcelle_ajoutee",
  PARCELLE_SUPPRIMEE = "parcelle_supprimee",
  JAUGE_DEPASSEE = "jauge_depassee",

  // Feature flags / interet utilisateur
  INTERET_MULTI_PARCELLES = "interet_multi_parcelles",
  INTERET_MISE_EN_RELATION = "interet_mise_en_relation",
  INTERET_EXPORT_RESULTATS = "interet_export_resultats",

  // Ouverture de la modale multisites (clic sur le CTA "Analyser plusieurs sites")
  OUVERTURE_MODALE_MULTISITES = "ouverture_modale_multisites",
  // Demande de mise en relation multisites (modale "Etre contacte")
  DEMANDE_CONTACT_MULTISITES = "demande_contact_multisites",
}

/**
 * Besoin exprime par l'utilisateur dans la modale de contact multisites
 */
export enum BesoinMultisites {
  // Liste de sites a suivre et comparer dans un espace dedie
  SUIVI_COMPARAISON = "suivi_comparaison",
  // Integrer Mutafriches a ses outils metier (SIG, portail cartographique, etc.)
  INTEGRATION_OUTILS = "integration_outils",
  // L'utilisateur ne sait pas encore quel besoin il a
  NE_SAIT_PAS = "ne-sait-pas",
}

export enum ModeUtilisation {
  STANDALONE = "standalone",
  IFRAME = "iframe",
}

/**
 * Contexte d'ou l'evenement a ete declenche dans le parcours utilisateur
 */
export enum ContexteEvenement {
  // Etape de selection de parcelle
  SELECTION_PARCELLE = "selection_parcelle",
  // Retrocompatibilite avec l'ancienne valeur
  STEP1_TOGGLE = "step1_toggle",
}
