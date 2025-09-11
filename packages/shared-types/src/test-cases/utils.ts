import { TestCase } from "./types";
import { testCases } from "./data";

/**
 * Récupère tous les noms de cas de test pour l'affichage dans les sélecteurs
 */
export function getTestCaseNames(): Array<{ id: string; name: string; description: string }> {
  return testCases.map((tc) => ({
    id: tc.id,
    name: tc.name,
    description: tc.description,
  }));
}

/**
 * Récupère un cas de test par son ID
 */
export function getTestCaseById(id: string): TestCase | undefined {
  return testCases.find((tc) => tc.id === id);
}

/**
 * Récupère tous les cas de test disponibles
 */
export function getAllTestCases(): TestCase[] {
  return testCases;
}

/**
 * Vérifie si un ID de cas de test existe
 */
export function testCaseExists(id: string): boolean {
  return testCases.some((tc) => tc.id === id);
}
