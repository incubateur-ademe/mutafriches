// TODO Import des fixtures JSON selon la version
import renaisonData from "./fixtures/v1.0/test-05-renaison.json";

import { TestCase } from "./types/test-case.types";

// Cast des données JSON vers le type TestCase
export const testCases: TestCase[] = [renaisonData as TestCase];

// Export individuel des cas de test
export const renaisonTestCase = renaisonData as TestCase;
