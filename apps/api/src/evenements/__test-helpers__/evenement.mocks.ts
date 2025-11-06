import { vi } from "vitest";

/**
 * Mocks spécifiques au domaine Evenements
 */

/**
 * Mock du EvenementService
 */
export function createMockEvenementService() {
  return {
    enregistrerEvenement: vi.fn(),
  };
}
