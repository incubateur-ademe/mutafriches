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

  // Ouverture du recapitulatif du site (clic "voir recapitulatif du site")
  OUVERTURE_RECAP_SITE = "ouverture_recap_site",
  // Ouverture du detail d'un usage (clic "voir le detail" dans le tableau des usages)
  OUVERTURE_DETAIL_USAGE = "ouverture_detail_usage",

  // Partage d'une page partenaire (clic sur le bouton "Partager")
  PARTAGE_PAGE_PARTENAIRE = "partage_page_partenaire",
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
