// TODO Import des fixtures JSON selon la version
import renaisonData from "./fixtures/v0/renaison.json";
import trelazeData from "./fixtures/v0/trelaze.json";

import { TestCase } from "./types/test-case.types";

// Cast des données JSON vers le type TestCase
export const testCases: TestCase[] = [renaisonData as TestCase, trelazeData as TestCase];

// Export individuel des cas de test
export const renaisonTestCase = renaisonData as TestCase;
export const trelazeTestCase = trelazeData as TestCase;
