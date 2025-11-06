import { CalculService } from "../services/calcul.service";
import {
  TestCase,
  convertTestCaseToMutabilityInput,
  UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { Parcelle } from "../entities/parcelle.entity";

/**
 * Seuils de validation pour les tests de fixtures
 */
export const VALIDATION_THRESHOLDS = {
  /** Écart acceptable pour un usage individuel (%) */
  MAX_ECART_USAGE: 1.5,
  /** Écart moyen acceptable sur tous les usages (%) */
  MAX_ECART_MOYEN: 1.0,
  /** Écart critique signalant un problème majeur (%) */
  ECART_CRITIQUE: 5.0,
} as const;

/**
 * Résultat de comparaison pour un usage
 */
export interface UsageComparison {
  usage: string;
  calculated: number;
  expected: number;
  ecart: number;
  rangCalcule: number;
  rangAttendu: number;
}

/**
 * Résultat de validation d'un test case
 */
export interface TestCaseValidation {
  testCaseId: string;
  usageComparisons: UsageComparison[];
  maxEcart: number;
  avgEcart: number;
  hasRankChanges: boolean;
  problems: string[];
}

/**
 * Convertit un TestCase en Parcelle pour le calcul
 */
export function convertTestCaseToParcelle(testCase: TestCase): Parcelle {
  const input = convertTestCaseToMutabilityInput(testCase);

  const parcelle = new Parcelle();
  Object.assign(parcelle, input.donneesEnrichies);
  Object.assign(parcelle, input.donneesComplementaires);

  return parcelle;
}

/**
 * Compare les résultats calculés avec les attentes du test case
 * Retourne un objet de validation détaillé
 */
export function compareResults(
  testCase: TestCase,
  calculatedResults: UsageResultatDetaille[],
): TestCaseValidation {
  const usageComparisons: UsageComparison[] = [];
  const problems: string[] = [];
  let hasRankChanges = false;

  testCase.expected.usages.forEach((expectedUsage) => {
    const calculatedUsage = calculatedResults.find((r) => r.usage === expectedUsage.usage);

    if (!calculatedUsage) {
      problems.push(`Usage ${expectedUsage.usage} non trouvé dans les résultats`);
      return;
    }

    const ecart = Math.abs(calculatedUsage.indiceMutabilite - expectedUsage.indiceMutabilite);

    // ⚠️ TEMPORAIRE : Inverser le rang attendu car les fixtures sont inversées
    // TODO: Corriger les fixtures Excel
    const rangAttenduInverse = 8 - expectedUsage.rang; // Rang 1 → 7, Rang 7 → 1

    const comparison: UsageComparison = {
      usage: expectedUsage.usage,
      calculated: calculatedUsage.indiceMutabilite,
      expected: expectedUsage.indiceMutabilite,
      ecart,
      rangCalcule: calculatedUsage.rang,
      rangAttendu: rangAttenduInverse, // ← Utiliser le rang inversé
    };

    usageComparisons.push(comparison);

    // Vérifier l'écart
    if (ecart > VALIDATION_THRESHOLDS.MAX_ECART_USAGE) {
      problems.push(
        `${expectedUsage.usage}: écart ${ecart.toFixed(1)}% ` +
          `(calculé: ${calculatedUsage.indiceMutabilite}%, attendu: ${expectedUsage.indiceMutabilite}%)`,
      );
    }

    // Vérifier les changements de rang (avec rang inversé)
    if (calculatedUsage.rang !== rangAttenduInverse) {
      hasRankChanges = true;
    }
  });

  const maxEcart = Math.max(...usageComparisons.map((c) => c.ecart));
  const avgEcart = usageComparisons.reduce((sum, c) => sum + c.ecart, 0) / usageComparisons.length;

  return {
    testCaseId: testCase.id,
    usageComparisons,
    maxEcart,
    avgEcart,
    hasRankChanges,
    problems,
  };
}

/**
 * Exécute le calcul pour un test case
 */
export async function executeTestCase(
  calculService: CalculService,
  testCase: TestCase,
): Promise<TestCaseValidation> {
  const parcelle = convertTestCaseToParcelle(testCase);

  const result = await calculService.calculer(parcelle, { modeDetaille: true });

  return compareResults(testCase, result.resultats as UsageResultatDetaille[]);
}

/**
 * Analyse globale de tous les tests
 */
export interface GlobalAnalysis {
  totalTests: number;
  totalUsages: number;
  avgEcart: number;
  maxEcart: number;
  problematicTests: number;
  totalRankChanges: number;
  ecartsByTest: Map<string, number>;
}

/**
 * Calcule les statistiques globales
 */
export function analyzeGlobalResults(validations: TestCaseValidation[]): GlobalAnalysis {
  const allEcarts: number[] = [];
  let problematicTests = 0;
  let totalRankChanges = 0;
  const ecartsByTest = new Map<string, number>();

  validations.forEach((validation) => {
    validation.usageComparisons.forEach((comparison) => {
      allEcarts.push(comparison.ecart);
    });

    ecartsByTest.set(validation.testCaseId, validation.maxEcart);

    if (validation.maxEcart > VALIDATION_THRESHOLDS.MAX_ECART_USAGE) {
      problematicTests++;
    }

    if (validation.hasRankChanges) {
      totalRankChanges++;
    }
  });

  return {
    totalTests: validations.length,
    totalUsages: allEcarts.length,
    avgEcart: allEcarts.reduce((sum, e) => sum + e, 0) / allEcarts.length,
    maxEcart: Math.max(...allEcarts),
    problematicTests,
    totalRankChanges,
    ecartsByTest,
  };
}

/**
 * Formate un rapport lisible des changements de rangs
 */
export function formatRankChangesReport(validations: TestCaseValidation[]): string {
  const changementsRangs: Array<{
    cas: string;
    usage: string;
    rangCalcule: number;
    rangAttendu: number;
    ecartRang: number;
  }> = [];

  validations.forEach((validation) => {
    validation.usageComparisons.forEach((comparison) => {
      if (comparison.rangCalcule !== comparison.rangAttendu) {
        changementsRangs.push({
          cas: validation.testCaseId,
          usage: comparison.usage,
          rangCalcule: comparison.rangCalcule,
          rangAttendu: comparison.rangAttendu,
          ecartRang: comparison.rangCalcule - comparison.rangAttendu,
        });
      }
    });
  });

  if (changementsRangs.length === 0) {
    return "Aucun changement de rang detecte - Parfait!";
  }

  let report = "";

  // Grouper par cas de test
  const parCas = changementsRangs.reduce(
    (acc, item) => {
      if (!acc[item.cas]) acc[item.cas] = [];
      acc[item.cas].push(item);
      return acc;
    },
    {} as Record<string, typeof changementsRangs>,
  );

  Object.entries(parCas).forEach(([cas, changements]) => {
    report += `\n${cas}:\n`;
    changements
      .sort((a, b) => Math.abs(b.ecartRang) - Math.abs(a.ecartRang))
      .forEach((ch) => {
        const direction = ch.ecartRang > 0 ? "↓" : "↑";
        report += `  ${ch.usage}: rang ${ch.rangAttendu} → ${ch.rangCalcule} `;
        report += `(${direction}${Math.abs(ch.ecartRang)} position${Math.abs(ch.ecartRang) > 1 ? "s" : ""})\n`;
      });
  });

  const totalChangements = changementsRangs.length;
  const moyenneEcart =
    changementsRangs.reduce((sum, ch) => sum + Math.abs(ch.ecartRang), 0) / totalChangements;

  report += `\n--------------------------\n`;
  report += `Total changements: ${totalChangements}\n`;
  report += `Ecart moyen de rang: ${moyenneEcart.toFixed(1)} positions\n`;

  return report;
}
