import { vi, type Mock } from "vitest";

/**
 * Mocks spécifiques au domaine Evaluation
 */

interface MockOrchestrateurService {
  calculerMutabilite: Mock;
  recupererEvaluation: Mock;
}

interface MockCalculService {
  calculer: Mock;
  calculerUsage: Mock;
  calculerFiabilite: Mock;
}

interface MockEvaluationRepository {
  save: Mock;
  findById: Mock;
  findByParcelleId: Mock;
  findValidCache: Mock;
  delete: Mock;
}

/**
 * Mock du OrchestrateurService
 * Service principal du domaine evaluation
 */
export function createMockOrchestrateurService(): MockOrchestrateurService {
  return {
    calculerMutabilite: vi.fn(),
    recupererEvaluation: vi.fn(),
  };
}

/**
 * Mock du CalculService
 * Service de calcul de mutabilité
 */
export function createMockCalculService(): MockCalculService {
  return {
    calculer: vi.fn(),
    calculerUsage: vi.fn(),
    calculerFiabilite: vi.fn(),
  };
}

/**
 * Mock du EvaluationRepository (si tu en as un)
 */
export function createMockEvaluationRepository(): MockEvaluationRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByParcelleId: vi.fn(),
    findValidCache: vi.fn(),
    delete: vi.fn(),
  };
}
