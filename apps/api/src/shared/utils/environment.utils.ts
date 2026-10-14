/**
 * Utilitaires pour la detection de l'environnement d'execution
 */

export type Environment = "development" | "production" | "staging" | "test";

/**
 * Retourne l'environnement courant
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV;
  if (env === "production" || env === "staging" || env === "test") {
    return env;
  }
  return "development";
}

/**
 * Verifie si l'application est en mode production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Verifie si l'application est en mode staging
 */
export function isStaging(): boolean {
  return process.env.NODE_ENV === "staging";
}

/**
 * Vérifie si l'application est en mode développement.
 * Explicite uniquement : un NODE_ENV absent ne lève aucun bypass de sécurité (guards,
 * CORS local, jeton de refresh). `start:dev` pose la variable.
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** NODE_ENV absent : l'application tourne avec les réglages de production, sans le dire. */
export function isEnvironnementNonDeclare(): boolean {
  return !process.env.NODE_ENV;
}

/**
 * Verifie si l'application est en mode test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Verifie si l'application est deployee (production ou staging)
 * Utile pour activer des comportements specifiques aux environnements distants
 */
export function isDeployed(): boolean {
  return isProduction() || isStaging();
}

/**
 * Verifie si l'application tourne en local (developpement ou test)
 */
export function isLocal(): boolean {
  return isDevelopment() || isTest();
}
