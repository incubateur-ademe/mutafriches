import { vi, type Mock } from "vitest";

/**
 * Mocks spécifiques au domaine Evenements
 */

interface MockEvenementService {
  enregistrerEvenement: Mock;
}

/**
 * Mock du EvenementService
 */
export function createMockEvenementService(): MockEvenementService {
  return {
    enregistrerEvenement: vi.fn(),
  };
}
