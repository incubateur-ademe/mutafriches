import { afterEach, vi } from "vitest";

/**
 * Configuration globale pour les tests Vitest
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
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

//  Nettoyer les APPELS des mocks, mais PAS les restaurer
afterEach(() => {
  vi.clearAllMocks(); // Reset les call counts et les implémentations
});

export { originalConsole };

export const forceLog = (...args: unknown[]) => {
  originalConsole.log(...args);
};

export const testLog = (...args: unknown[]) => {
  if (process.env.VERBOSE) {
    originalConsole.log(...args);
  }
};
