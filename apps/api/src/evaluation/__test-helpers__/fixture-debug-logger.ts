/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { TestCase } from "@mutafriches/shared-types";

// Interface simplifiée pour le résultat de mutabilité
interface MutabiliteResult {
  fiabilite: any;
  resultats: Array<{
    usage: string;
    indiceMutabilite: number;
    rang: number;
  }>;
}

export interface DebugLogEntry {
  testCaseId: string;
  timestamp: string;
  fixtureSnapshot: {
    // Snapshot complet de la fixture au moment du test
    fullTestCase: any;
    inputHash: string; // Hash MD5 de l'input pour détecter les changements
    expectedHash: string; // Hash MD5 des valeurs attendues
  };
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
    // Créer des hash pour détecter les changements dans les fixtures
    const inputHash = this.createHash(testCase.input);
    const expectedHash = this.createHash(testCase.expected);

    this.currentLog = {
      testCaseId: testCase.id,
      timestamp: new Date().toISOString(),
      fixtureSnapshot: {
        fullTestCase: JSON.parse(JSON.stringify(testCase)), // Deep clone
        inputHash,
        expectedHash,
      },
      input: {
        raw: testCase.input,
        normalized: {},
      },
      calculationSteps: [],
    };
  }

  private createHash(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash("md5").update(str).digest("hex");
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

  logOutput(result: MutabiliteResult) {
    if (this.currentLog) {
      this.currentLog.output = {
        usages: result.resultats.map((u) => ({
          usage: u.usage,
          indiceMutabilite: u.indiceMutabilite,
          rang: u.rang,
          details: (u as any).detailsCalcul || {},
        })),
        metadata: result.fiabilite,
      };
    }
  }

  logComparison(testCase: TestCase, calculated: MutabiliteResult) {
    if (this.currentLog) {
      const ecarts = testCase.expected.usages.map((expectedUsage) => {
        const calculatedUsage = calculated.resultats.find((u) => u.usage === expectedUsage.usage);
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
          usages: calculated.resultats,
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

      // Snapshot de la fixture
      lines.push("FIXTURE SNAPSHOT:");
      lines.push(`  Version algorithme: ${log.fixtureSnapshot.fullTestCase.algorithmVersion}`);
      lines.push(`  Source: ${log.fixtureSnapshot.fullTestCase.source}`);
      lines.push(`  Input Hash: ${log.fixtureSnapshot.inputHash}`);
      lines.push(`  Expected Hash: ${log.fixtureSnapshot.expectedHash}`);
      lines.push("");

      // Input
      lines.push("INPUT:");
      lines.push(JSON.stringify(log.input.raw, null, 2));
      lines.push("");

      // Expected (depuis la fixture)
      lines.push("EXPECTED (depuis fixture):");
      log.fixtureSnapshot.fullTestCase.expected.usages.forEach((usage: any) => {
        lines.push(`  ${usage.usage}: ${usage.indiceMutabilite}% (rang ${usage.rang})`);
      });
      lines.push("");

      // Étapes de calcul
      if (log.calculationSteps && log.calculationSteps.length > 0) {
        lines.push("ÉTAPES DE CALCUL:");
        log.calculationSteps.forEach((step, idx) => {
          lines.push(`  ${idx + 1}. ${step.step}`);
          // Pour les steps de score, afficher un résumé
          if (step.step.includes("Score détaillé")) {
            const data = step.data as any;
            lines.push(`     Avantages: ${data.avantages}, Contraintes: ${data.contraintes}`);
            lines.push(`     Indice: ${data.indice}%`);
            lines.push(`     Formule: ${data.formule}`);
          }
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
