/**
 * Configuration centralisee des routes de l'application
 */
export const ROUTES = {
  // Pages principales du parcours
  HOME: "/",
  ENRICHISSEMENT: "/enrichissement",

  // Qualification (3 etapes)
  QUALIFICATION_SITE: "/qualification/site",
  QUALIFICATION_ENVIRONNEMENT: "/qualification/environnement",
  QUALIFICATION_RISQUES: "/qualification/risques",

  // Resultats
  RESULTATS: "/resultats",

  // Documentation
  DOCUMENTATION_INTEGRATION: "/documentation-integration",
  API: "/api",

  // Pages de test
  TESTS: "/tests",
  TEST_MUTABILITE: "/test/algorithme",
  TEST_IFRAME: "/test/iframe",
  TEST_CALLBACK: "/test/callback",

  // Legacy (pour compatibilite temporaire)
  DEBUG: "/debug",
} as const;

/**
 * Mapping des etapes de qualification
 */
export const QUALIFICATION_STEPS = {
  1: ROUTES.QUALIFICATION_SITE,
  2: ROUTES.QUALIFICATION_ENVIRONNEMENT,
  3: ROUTES.QUALIFICATION_RISQUES,
} as const;

/**
 * Helper pour obtenir la route d'une etape de qualification
 */
export const getQualificationStepRoute = (stepNumber: 1 | 2 | 3): string => {
  return QUALIFICATION_STEPS[stepNumber];
};

/**
 * Helper pour obtenir le numero d'etape depuis l'URL actuelle
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
 * @deprecated Utiliser getQualificationStepRoute a la place
 */
export const getStepRoute = (stepNumber: 1 | 2 | 3): string => {
  return getQualificationStepRoute(stepNumber);
};
