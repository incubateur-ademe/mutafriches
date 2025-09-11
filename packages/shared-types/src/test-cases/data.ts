import renaisonData from "./renaison.json";
import trelazeData from "./trelaze.json";
import { TestCase } from "./types";

// Cast des données JSON vers le type TestCase
export const testCases: TestCase[] = [renaisonData as TestCase, trelazeData as TestCase];

// Export individuel des cas de test
export const renaisonTestCase = renaisonData as TestCase;
export const trelazeTestCase = trelazeData as TestCase;
