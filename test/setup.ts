/**
 * Configuration globale pour les tests Vitest
 * Contrôle l'affichage des logs selon la variable d'environnement VERBOSE
 */

// Sauvegarder les méthodes originales
const originalConsole = {
  log: console.log,
  info: console.info,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
};

// Si VERBOSE n'est pas défini, désactiver certains logs
if (!process.env.VERBOSE) {
  // Désactiver les logs normaux
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};

  // Garder warn et error pour les vrais problèmes
  // console.warn = () => {};
  // console.error = () => {};
}

// Exporter les méthodes originales si besoin
export { originalConsole };

/**
 * Helper pour forcer un log même en mode non-verbose
 * Utile pour les erreurs critiques
 */
export const forceLog = (...args: any[]) => {
  originalConsole.log(...args);
};

/**
 * Logger conditionnel pour les tests
 * Alternative à console.log qui respecte VERBOSE
 */
export const testLog = (...args: any[]) => {
  if (process.env.VERBOSE) {
    originalConsole.log(...args);
  }
};
