import * as fs from 'fs';
import * as path from 'path';
import { FricheTestCase } from './friches-test-cases.interface';

/**
 * Service pour charger et gérer les cas de test des friches
 */
export class TestDataLoaderService {
  private testCases: Map<string, FricheTestCase> = new Map();
  private readonly testDataPath: string;

  constructor() {
    this.testDataPath = path.join(__dirname, 'cases');
    this.loadAllTestCases();
  }

  /**
   * Charge tous les fichiers JSON du dossier cases/
   */
  private loadAllTestCases(): void {
    try {
      if (!fs.existsSync(this.testDataPath)) {
        console.warn(`Test data directory not found: ${this.testDataPath}`);
        return;
      }

      const files = fs.readdirSync(this.testDataPath);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      jsonFiles.forEach((file) => {
        try {
          const filePath = path.join(this.testDataPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const testCase = JSON.parse(content) as FricheTestCase;

          this.testCases.set(testCase.id, testCase);
          console.log(`Loaded test case: ${testCase.id} - ${testCase.name}`);
        } catch (error) {
          console.error(`Error loading test case from ${file}:`, error);
        }
      });

      console.log(`Total test cases loaded: ${this.testCases.size}`);
    } catch (error) {
      console.error('Error loading test cases:', error);
    }
  }

  /**
   * Récupère un cas de test par son ID
   */
  getTestCase(id: string): FricheTestCase | undefined {
    return this.testCases.get(id);
  }

  /**
   * Récupère tous les cas de test
   */
  getAllTestCases(): FricheTestCase[] {
    return Array.from(this.testCases.values());
  }

  /**
   * Valide qu'un cas de test est conforme
   */
  validateTestCase(testCase: FricheTestCase): string[] {
    const errors: string[] = [];

    if (!testCase.id) errors.push('Missing test case ID');
    if (!testCase.name) errors.push('Missing test case name');
    if (!testCase.input) errors.push('Missing input data');
    if (!testCase.expected) errors.push('Missing expected results');
    if (!testCase.expected.usages || testCase.expected.usages.length !== 7) {
      errors.push('Expected results must contain exactly 7 usages');
    }

    // Vérifier que les rangs sont corrects (1 à 7)
    const rangs = testCase.expected.usages.map((u) => u.rang).sort();
    const expectedRangs = [1, 2, 3, 4, 5, 6, 7];
    if (JSON.stringify(rangs) !== JSON.stringify(expectedRangs)) {
      errors.push('Usage ranks must be 1 through 7');
    }

    return errors;
  }
}
