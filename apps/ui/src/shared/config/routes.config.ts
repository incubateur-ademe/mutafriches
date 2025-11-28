/**
 * Configuration centralisée des routes de l'application
 */
export const ROUTES = {
  HOME: "/",
  STEP1: "/localisation",
  STEP2: "/donnees-complementaires",
  STEP3: "/resultats",
  DEBUG: "/debug",
  API: "/api",
  TESTS: "/tests",
  TEST_CARTE_PARCELLE: "/test/carte-parcelle",
  TEST_ENRICHISSEMENT: "/test/enrichissement-parcelle",
  TEST_MUTABILITE: "/test/algorithme",
  TEST_IFRAME: "/test/iframe",
  TEST_CALLBACK: "/test/callback",
} as const;

/**
 * Helper pour obtenir la route d'une étape
 */
export const getStepRoute = (stepNumber: 1 | 2 | 3): string => {
  switch (stepNumber) {
    case 1:
      return ROUTES.STEP1;
    case 2:
      return ROUTES.STEP2;
    case 3:
      return ROUTES.STEP3;
    default:
      return ROUTES.HOME;
  }
};

/**
 * Helper pour obtenir le numéro d'étape depuis l'URL actuelle
 */
export const getCurrentStepFromPath = (pathname: string): number | null => {
  switch (pathname) {
    case ROUTES.STEP1:
      return 1;
    case ROUTES.STEP2:
      return 2;
    case ROUTES.STEP3:
      return 3;
    default:
      return null;
  }
};
