/**
 * Configuration centralisée des routes de l'application
 */
export const ROUTES = {
  // Pages principales du parcours
  HOME: "/",
  ENRICHISSEMENT: "/enrichissement",

  // Qualification (3 étapes)
  QUALIFICATION_SITE: "/qualification/site",
  QUALIFICATION_ENVIRONNEMENT: "/qualification/environnement",
  QUALIFICATION_RISQUES: "/qualification/risques",

  // Résultats
  RESULTATS: "/resultats",

  // Documentation
  DOCUMENTATION_INTEGRATION: "/documentation-integration",
  API: "/api",

  // Pages de test
  TESTS: "/tests",
  TEST_MUTABILITE: "/test/algorithme",
  TEST_IFRAME: "/test/iframe",
  TEST_CALLBACK: "/test/callback",

  // Legacy (pour compatibilité temporaire)
  DEBUG: "/debug",
} as const;

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
