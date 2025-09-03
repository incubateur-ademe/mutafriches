// src/friches/services/mutability/debug-simple.ts

import { MutabilityCalculationService } from '../mutability-calculation.service';
import { TestDataLoaderService } from '../test-data/test-data-loader.service';

export function debugSimple(testCaseId: string = 'renaison-001') {
  const testLoader = new TestDataLoaderService();
  const service = new MutabilityCalculationService();

  const testCase = testLoader.getTestCase(testCaseId);
  if (!testCase) {
    console.log(`Cas de test ${testCaseId} non trouvé`);
    return;
  }

  console.log(`\n=== DEBUG SIMPLE: ${testCase.name} ===`);

  // Calculer les résultats
  const result = service.calculateMutability(testCase.input);

  // Comparaison simple
  console.log('\nCOMPARAISON ALGORITHME vs EXCEL:');
  console.log(
    'Usage'.padEnd(15) +
      'Algo'.padEnd(8) +
      'Excel'.padEnd(8) +
      'Écart'.padEnd(8) +
      'RangAlgo'.padEnd(10) +
      'RangExcel',
  );
  console.log('-'.repeat(60));

  testCase.expected.usages.forEach((expectedUsage) => {
    const actualUsage = result.resultats.find(
      (r) => r.usage === expectedUsage.usage,
    );
    if (actualUsage) {
      const ecart =
        actualUsage.indiceMutabilite - expectedUsage.indiceMutabilite;
      const ecartRang = actualUsage.rang - expectedUsage.rang;
      const status = Math.abs(ecart) > 5 ? ' ❌' : ' ✅';

      console.log(
        expectedUsage.usage.padEnd(15) +
          `${actualUsage.indiceMutabilite}%`.padEnd(8) +
          `${expectedUsage.indiceMutabilite}%`.padEnd(8) +
          `${ecart > 0 ? '+' : ''}${ecart}%`.padEnd(8) +
          `${actualUsage.rang}`.padEnd(10) +
          `${expectedUsage.rang} (${ecartRang > 0 ? '+' : ''}${ecartRang})${status}`,
      );
    }
  });

  // Fiabilité
  console.log('\nFIABILITE:');
  console.log(`Algo: ${result.fiabilite.note}/10 (${result.fiabilite.text})`);
  console.log(
    `Excel: ${testCase.expected.fiabilite.note}/10 (${testCase.expected.fiabilite.text})`,
  );

  // Problèmes principaux
  const problemesGraves = testCase.expected.usages.filter((expected) => {
    const actual = result.resultats.find((r) => r.usage === expected.usage);
    return (
      actual &&
      Math.abs(actual.indiceMutabilite - expected.indiceMutabilite) > 10
    );
  });

  if (problemesGraves.length > 0) {
    console.log('\n❌ PROBLEMES GRAVES (écart > 10%):');
    problemesGraves.forEach((p) => {
      const actual = result.resultats.find((r) => r.usage === p.usage);
      console.log(
        `- ${p.usage}: ${actual?.indiceMutabilite}% vs ${p.indiceMutabilite}%`,
      );
    });
  }

  console.log('\n=== FIN DEBUG ===\n');
}

// Debug spécifique pour Trélazé
export function debugTrelaze() {
  console.log('=== DEBUG TRELAZE ===');
  debugSimple('trelaze-001');
}
