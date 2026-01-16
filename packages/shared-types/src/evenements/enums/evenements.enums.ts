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

  // Feature flags / interet utilisateur
  INTERET_MULTI_PARCELLES = "interet_multi_parcelles",
  INTERET_MISE_EN_RELATION = "interet_mise_en_relation",
  INTERET_EXPORT_RESULTATS = "interet_export_resultats",
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
