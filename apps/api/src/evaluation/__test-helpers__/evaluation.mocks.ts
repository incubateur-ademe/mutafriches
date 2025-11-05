import { vi } from "vitest";

/**
 * Mocks spécifiques au domaine Evaluation
 */

/**
 * Mock du OrchestrateurService
 * Service principal du domaine evaluation
 */
export function createMockOrchestrateurService() {
  return {
    calculerMutabilite: vi.fn(),
    recupererEvaluation: vi.fn(),
  };
}

/**
 * Mock du CalculService
 * Service de calcul de mutabilité
 */
export function createMockCalculService() {
  return {
    calculer: vi.fn(),
    calculerUsage: vi.fn(),
    calculerFiabilite: vi.fn(),
  };
}

/**
 * Mock du EvaluationRepository (si tu en as un)
 */
export function createMockEvaluationRepository() {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByParcelleId: vi.fn(),
    delete: vi.fn(),
  };
}
