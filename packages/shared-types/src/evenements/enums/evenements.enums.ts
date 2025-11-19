export enum TypeEvenement {
  VISITE = "visite",
  ENRICHISSEMENT_TERMINE = "enrichissement_termine",
  DONNEES_COMPLEMENTAIRES_SAISIES = "donnees_complementaires_saisies",
  EVALUATION_TERMINEE = "evaluation_terminee",

  // Feedback sur résultats
  FEEDBACK_PERTINENCE_CLASSEMENT = "feedback_pertinence_classement",

  // Feature flags / intérêt utilisateur
  INTERET_MULTI_PARCELLES = "interet_multi_parcelles",
  INTERET_MISE_EN_RELATION = "interet_mise_en_relation",
  INTERET_EXPORT_RESULTATS = "interet_export_resultats",
}
