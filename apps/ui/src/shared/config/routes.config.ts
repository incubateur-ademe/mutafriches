/**
 * Configuration centralisée des routes de l'application
 */
export const ROUTES = {
  // Pages principales du parcours
  HOME: "/",
  ANALYSER: "/analyser",
  ENRICHISSEMENT: "/enrichissement",

  // Qualification (3 étapes)
  QUALIFICATION_SITE: "/qualification/site",
  QUALIFICATION_ENVIRONNEMENT: "/qualification/environnement",
  QUALIFICATION_RISQUES: "/qualification/risques",

  // Résultats
  RESULTATS: "/resultats",

  // Statistiques
  STATISTIQUES: "/statistiques",

  // Documentation
  DOCUMENTATION_INTEGRATION: "/documentation-integration",
  API: "/api",

  // Statut technique
  DONNEES_UTILISEES: "/donnees-utilisees",

  // Documentation des sources de données (partenaires)
  DOCUMENTATION_SOURCES: "/documentation-donnees",

  // Pages légales
  MENTIONS_LEGALES: "/mentions-legales",
  POLITIQUE_CONFIDENTIALITE: "/politique-de-confidentialite",
  ACCESSIBILITE: "/accessibilite",

  // Pages de test
  TESTS: "/tests",
  TEST_IFRAME: "/test/iframe",
  TEST_CALLBACK: "/test/callback",
  TEST_DIAGNOSTIC_PARCELLE: "/test/diagnostic-parcelle",
  TEST_RESOLUTION_IDU: "/test/resolution-idu",

  // Partenaires
  PARTENAIRES: "/partenaires",
  PARTENAIRE_DETAIL: "/partenaires/:slug", // route dynamique résolue via le registre
  CCI_92: "/partenaires/cci-92", // conservé comme constante de lien (matche la route dynamique)

  // Legacy (pour compatibilité temporaire)
  DEBUG: "/debug",
} as const;

/**
 * Construit l'URL de la page d'un partenaire à partir de son slug
 */
export const partenaireRoute = (slug: string): string => `/partenaires/${slug}`;

/**
 * Mapping des étapes de qualification
 */
export const QUALIFICATION_STEPS = {
  1: ROUTES.QUALIFICATION_SITE,
  2: ROUTES.QUALIFICATION_ENVIRONNEMENT,
  3: ROUTES.QUALIFICATION_RISQUES,
} as const;

/**
 * Helper pour obtenir la route d'une étape de qualification
 */
export const getQualificationStepRoute = (stepNumber: 1 | 2 | 3): string => {
  return QUALIFICATION_STEPS[stepNumber];
};

/**
 * Helper pour obtenir le numéro d'étape depuis l'URL actuelle
 */
export const getCurrentStepFromPath = (pathname: string): number | null => {
  switch (pathname) {
    case ROUTES.QUALIFICATION_SITE:
      return 1;
    case ROUTES.QUALIFICATION_ENVIRONNEMENT:
      return 2;
    case ROUTES.QUALIFICATION_RISQUES:
      return 3;
    default:
      return null;
  }
};

/**
 * @deprecated Utiliser getQualificationStepRoute à la place
 */
export const getStepRoute = (stepNumber: 1 | 2 | 3): string => {
  return getQualificationStepRoute(stepNumber);
};
