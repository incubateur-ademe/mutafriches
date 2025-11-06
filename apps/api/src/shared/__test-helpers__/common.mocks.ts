import { vi } from "vitest";

/**
 * Mocks de services partagés entre tous les domaines
 */

/**
 * Mock du DatabaseService
 * Utilisé dans pratiquement tous les tests d'intégration
 */
export function createMockDatabaseService() {
  return {
    db: {
      execute: vi.fn().mockResolvedValue([{ test: 1 }]),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    },
    onModuleInit: vi.fn(),
    onModuleDestroy: vi.fn(),
  };
}

/**
 * Mock générique pour n'importe quel service
 * Crée automatiquement des mocks pour toutes les méthodes
 *
 * @example
 * const mockService = createGenericMock(['method1', 'method2']);
 */
export function createGenericMock<T extends string[]>(
  methods: T,
): Record<T[number], ReturnType<typeof vi.fn>> {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  for (const method of methods) {
    mock[method] = vi.fn();
  }

  return mock as Record<T[number], ReturnType<typeof vi.fn>>;
}
