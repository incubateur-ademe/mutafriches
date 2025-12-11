import * as fs from "fs";
import * as path from "path";
import type { TestCase } from "@mutafriches/shared-types";
import type { MutabiliteOutputDto } from "@mutafriches/shared-types";

export interface DebugLogEntry {
  testCaseId: string;
  timestamp: string;
  input: {
    raw: any;
    normalized: any;
  };
  calculationSteps: {
    step: string;
    data: any;
  }[];
  output: {
    usages: Array<{
      usage: string;
      indiceMutabilite: number;
      rang: number;
      details?: any;
    }>;
    metadata?: any;
  };
  comparison: {
    expected: any;
    calculated: any;
    ecarts: Array<{
      usage: string;
      expectedScore: number;
      calculatedScore: number;
      ecart: number;
      expectedRang: number;
      calculatedRang: number;
    }>;
  };
}

export class FixtureDebugLogger {
  private logs: DebugLogEntry[] = [];
  private currentLog: Partial<DebugLogEntry> | null = null;

  startTestCase(testCase: TestCase) {
    this.currentLog = {
      testCaseId: testCase.id,
      timestamp: new Date().toISOString(),
      input: {
        raw: testCase.input,
        normalized: {},
      },
      calculationSteps: [],
    };
  }

  logNormalizedInput(normalizedInput: any) {
    if (this.currentLog) {
      this.currentLog.input = {
        ...this.currentLog.input,
        normalized: normalizedInput,
      };
    }
  }

  logCalculationStep(step: string, data: any) {
    if (this.currentLog) {
      if (!this.currentLog.calculationSteps) {
        this.currentLog.calculationSteps = [];
      }
      this.currentLog.calculationSteps.push({
        step,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
      });
    }
  }

  logOutput(result: MutabiliteOutputDto) {
    if (this.currentLog) {
      this.currentLog.output = {
        usages: result.usages.map((u) => ({
          usage: u.usage,
          indiceMutabilite: u.indiceMutabilite,
          rang: u.rang,
          details: (u as any).details || {},
        })),
        metadata: (result as any).metadata || {},
      };
    }
  }

  logComparison(testCase: TestCase, calculated: MutabiliteOutputDto) {
    if (this.currentLog) {
      const ecarts = testCase.expected.usages.map((expectedUsage) => {
        const calculatedUsage = calculated.usages.find((u) => u.usage === expectedUsage.usage);
        return {
          usage: expectedUsage.usage,
          expectedScore: expectedUsage.indiceMutabilite,
          calculatedScore: calculatedUsage?.indiceMutabilite || 0,
          ecart: Math.abs(
            expectedUsage.indiceMutabilite - (calculatedUsage?.indiceMutabilite || 0),
          ),
          expectedRang: expectedUsage.rang,
          calculatedRang: calculatedUsage?.rang || 0,
        };
      });

      this.currentLog.comparison = {
        expected: testCase.expected,
        calculated: {
          usages: calculated.usages,
        },
        ecarts,
      };
    }
  }

  endTestCase() {
    if (this.currentLog) {
      this.logs.push(this.currentLog as DebugLogEntry);
      this.currentLog = null;
    }
  }

  saveToFile(outputPath: string) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Sauvegarder en JSON pour analyse
    fs.writeFileSync(outputPath, JSON.stringify(this.logs, null, 2));

    // Aussi créer un fichier texte lisible
    const txtPath = outputPath.replace(".json", ".txt");
    const readable = this.generateReadableReport();
    fs.writeFileSync(txtPath, readable);

    console.log(`Debug logs sauvegardés dans:`);
    console.log(`  - ${outputPath} (JSON détaillé)`);
    console.log(`  - ${txtPath} (rapport lisible)`);
  }

  private generateReadableReport(): string {
    const lines: string[] = [];

    lines.push("=".repeat(80));
    lines.push("RAPPORT DE DEBUG DES FIXTURES");
    lines.push(`Date: ${new Date().toISOString()}`);
    lines.push(`Nombre de test cases: ${this.logs.length}`);
    lines.push("=".repeat(80));
    lines.push("");

    this.logs.forEach((log) => {
      lines.push("");
      lines.push("-".repeat(80));
      lines.push(`TEST CASE: ${log.testCaseId}`);
      lines.push("-".repeat(80));
      lines.push("");

      // Input
      lines.push("INPUT:");
      lines.push(JSON.stringify(log.input.raw, null, 2));
      lines.push("");

      // Étapes de calcul
      if (log.calculationSteps && log.calculationSteps.length > 0) {
        lines.push("ÉTAPES DE CALCUL:");
        log.calculationSteps.forEach((step, idx) => {
          lines.push(`  ${idx + 1}. ${step.step}`);
          lines.push(`     ${JSON.stringify(step.data)}`);
        });
        lines.push("");
      }

      // Comparaison
      lines.push("COMPARAISON:");
      if (log.comparison && log.comparison.ecarts) {
        log.comparison.ecarts.forEach((ecart) => {
          const status = ecart.ecart > 1.5 ? "⚠️ PROBLÉMATIQUE" : "✓ OK";
          lines.push(`  ${ecart.usage}:`);
          lines.push(`    Attendu: ${ecart.expectedScore}% (rang ${ecart.expectedRang})`);
          lines.push(`    Calculé: ${ecart.calculatedScore}% (rang ${ecart.calculatedRang})`);
          lines.push(`    Écart: ${ecart.ecart.toFixed(2)}% ${status}`);
        });
      }
      lines.push("");
    });

    return lines.join("\n");
  }

  // Helper pour obtenir un résumé rapide
  getSummary() {
    const totalTests = this.logs.length;
    const problematicTests = this.logs.filter((log) => {
      return log.comparison?.ecarts.some((e) => e.ecart > 1.5);
    });

    return {
      totalTests,
      problematicTests: problematicTests.length,
      details: problematicTests.map((log) => ({
        testCaseId: log.testCaseId,
        maxEcart: Math.max(...(log.comparison?.ecarts.map((e) => e.ecart) || [0])),
      })),
    };
  }
}
