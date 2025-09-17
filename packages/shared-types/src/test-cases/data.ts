import renaisonData from "./fixtures/renaison.json";
import trelazeData from "./fixtures/trelaze.json";
import { TestCase } from "./types/test-case.types";

// Cast des données JSON vers le type TestCase
export const testCases: TestCase[] = [renaisonData as TestCase, trelazeData as TestCase];

// Export individuel des cas de test
export const renaisonTestCase = renaisonData as TestCase;
export const trelazeTestCase = trelazeData as TestCase;
