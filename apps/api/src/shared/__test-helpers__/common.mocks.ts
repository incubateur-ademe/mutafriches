import { vi, type Mock } from "vitest";

/**
 * Mocks de services partagés entre tous les domaines
 */

interface MockDb {
  execute: Mock;
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  values: Mock;
  where: Mock;
  set: Mock;
  returning: Mock;
}

interface MockDatabaseService {
  db: MockDb;
  onModuleInit: Mock;
  onModuleDestroy: Mock;
}

/**
 * Mock du DatabaseService
 * Utilisé dans pratiquement tous les tests d'intégration
 */
export function createMockDatabaseService(): MockDatabaseService {
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
export function createGenericMock<T extends string[]>(methods: T): Record<T[number], Mock> {
  const mock: Record<string, Mock> = {};

  for (const method of methods) {
    mock[method] = vi.fn();
  }

  return mock as Record<T[number], Mock>;
}
