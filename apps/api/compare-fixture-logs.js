#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function compareFixtureLogs(goodLogPath, badLogPath) {
  console.log("Comparaison des logs de fixtures...\n");

  const goodLogs = JSON.parse(fs.readFileSync(goodLogPath, "utf8"));
  const badLogs = JSON.parse(fs.readFileSync(badLogPath, "utf8"));

  const differences = [];

  goodLogs.forEach((goodLog) => {
    const badLog = badLogs.find((log) => log.testCaseId === goodLog.testCaseId);

    if (!badLog) {
      differences.push({
        testCaseId: goodLog.testCaseId,
        type: "MISSING",
        message: "Test case manquant dans le nouveau commit",
      });
      return;
    }

    // NOUVEAU : Comparer les fixtures elles-mêmes
    if (goodLog.fixtureSnapshot && badLog.fixtureSnapshot) {
      // Comparer les hash
      if (goodLog.fixtureSnapshot.inputHash !== badLog.fixtureSnapshot.inputHash) {
        differences.push({
          testCaseId: goodLog.testCaseId,
          type: "FIXTURE_INPUT_CHANGED",
          details: compareObjects(
            goodLog.fixtureSnapshot.fullTestCase.input,
            badLog.fixtureSnapshot.fullTestCase.input,
          ),
          oldHash: goodLog.fixtureSnapshot.inputHash,
          newHash: badLog.fixtureSnapshot.inputHash,
        });
      }

      if (goodLog.fixtureSnapshot.expectedHash !== badLog.fixtureSnapshot.expectedHash) {
        differences.push({
          testCaseId: goodLog.testCaseId,
          type: "FIXTURE_EXPECTED_CHANGED",
          details: compareExpectedUsages(
            goodLog.fixtureSnapshot.fullTestCase.expected.usages,
            badLog.fixtureSnapshot.fullTestCase.expected.usages,
          ),
          oldHash: goodLog.fixtureSnapshot.expectedHash,
          newHash: badLog.fixtureSnapshot.expectedHash,
        });
      }
    }

    // Comparer les inputs
    const inputDiff = compareObjects(goodLog.input, badLog.input);
    if (inputDiff.length > 0) {
      differences.push({
        testCaseId: goodLog.testCaseId,
        type: "INPUT_DIFF",
        details: inputDiff,
      });
    }

    // Comparer les étapes de calcul
    const stepsDiff = compareCalculationSteps(goodLog.calculationSteps, badLog.calculationSteps);
    if (stepsDiff.length > 0) {
      differences.push({
        testCaseId: goodLog.testCaseId,
        type: "CALCULATION_DIFF",
        details: stepsDiff,
      });
    }

    // Comparer les outputs
    const outputDiff = compareOutputs(goodLog.output, badLog.output);
    if (outputDiff.length > 0) {
      differences.push({
        testCaseId: goodLog.testCaseId,
        type: "OUTPUT_DIFF",
        details: outputDiff,
      });
    }

    // Comparer les écarts
    if (goodLog.comparison && badLog.comparison) {
      const ecartDiff = compareEcarts(goodLog.comparison.ecarts, badLog.comparison.ecarts);
      if (ecartDiff.length > 0) {
        differences.push({
          testCaseId: goodLog.testCaseId,
          type: "SCORE_DIFF",
          details: ecartDiff,
        });
      }
    }
  });

  return differences;
}

function compareExpectedUsages(usages1, usages2) {
  const diffs = [];

  usages1.forEach((usage1) => {
    const usage2 = usages2.find((u) => u.usage === usage1.usage);

    if (!usage2) {
      diffs.push({
        usage: usage1.usage,
        type: "MISSING_USAGE",
      });
      return;
    }

    if (usage1.indiceMutabilite !== usage2.indiceMutabilite) {
      diffs.push({
        usage: usage1.usage,
        type: "EXPECTED_SCORE_CHANGED",
        oldScore: usage1.indiceMutabilite,
        newScore: usage2.indiceMutabilite,
        delta: usage2.indiceMutabilite - usage1.indiceMutabilite,
      });
    }

    if (usage1.rang !== usage2.rang) {
      diffs.push({
        usage: usage1.usage,
        type: "EXPECTED_RANK_CHANGED",
        oldRank: usage1.rang,
        newRank: usage2.rang,
      });
    }
  });

  return diffs;
}

function compareObjects(obj1, obj2, path = "") {
  const diffs = [];

  const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  keys.forEach((key) => {
    const fullPath = path ? `${path}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    if (val1 === undefined && val2 !== undefined) {
      diffs.push({
        path: fullPath,
        type: "ADDED",
        oldValue: undefined,
        newValue: val2,
      });
    } else if (val1 !== undefined && val2 === undefined) {
      diffs.push({
        path: fullPath,
        type: "REMOVED",
        oldValue: val1,
        newValue: undefined,
      });
    } else if (typeof val1 === "object" && typeof val2 === "object") {
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          diffs.push({
            path: fullPath,
            type: "MODIFIED",
            oldValue: val1,
            newValue: val2,
          });
        }
      } else {
        diffs.push(...compareObjects(val1, val2, fullPath));
      }
    } else if (val1 !== val2) {
      diffs.push({
        path: fullPath,
        type: "MODIFIED",
        oldValue: val1,
        newValue: val2,
      });
    }
  });

  return diffs;
}

function compareCalculationSteps(steps1, steps2) {
  const diffs = [];

  if (!steps1 || !steps2) return diffs;

  const maxLength = Math.max(steps1.length, steps2.length);

  for (let i = 0; i < maxLength; i++) {
    const step1 = steps1[i];
    const step2 = steps2[i];

    if (!step1) {
      diffs.push({
        step: i,
        type: "ADDED_STEP",
        newStep: step2.step,
      });
    } else if (!step2) {
      diffs.push({
        step: i,
        type: "REMOVED_STEP",
        oldStep: step1.step,
      });
    } else if (step1.step !== step2.step) {
      diffs.push({
        step: i,
        type: "STEP_NAME_CHANGED",
        oldStep: step1.step,
        newStep: step2.step,
      });
    } else {
      const dataDiff = compareObjects(step1.data, step2.data, step1.step);
      if (dataDiff.length > 0) {
        diffs.push({
          step: i,
          stepName: step1.step,
          type: "STEP_DATA_CHANGED",
          changes: dataDiff,
        });
      }
    }
  }

  return diffs;
}

function compareOutputs(output1, output2) {
  const diffs = [];

  if (!output1?.usages || !output2?.usages) return diffs;

  output1.usages.forEach((usage1) => {
    const usage2 = output2.usages.find((u) => u.usage === usage1.usage);

    if (!usage2) {
      diffs.push({
        usage: usage1.usage,
        type: "MISSING_USAGE",
      });
      return;
    }

    if (usage1.indiceMutabilite !== usage2.indiceMutabilite) {
      diffs.push({
        usage: usage1.usage,
        type: "SCORE_CHANGED",
        oldScore: usage1.indiceMutabilite,
        newScore: usage2.indiceMutabilite,
        delta: usage2.indiceMutabilite - usage1.indiceMutabilite,
      });
    }

    if (usage1.rang !== usage2.rang) {
      diffs.push({
        usage: usage1.usage,
        type: "RANK_CHANGED",
        oldRank: usage1.rang,
        newRank: usage2.rang,
      });
    }
  });

  return diffs;
}

function compareEcarts(ecarts1, ecarts2) {
  const diffs = [];

  ecarts1.forEach((ecart1) => {
    const ecart2 = ecarts2.find((e) => e.usage === ecart1.usage);

    if (!ecart2) return;

    if (ecart1.calculatedScore !== ecart2.calculatedScore) {
      diffs.push({
        usage: ecart1.usage,
        type: "CALCULATED_SCORE_CHANGED",
        oldCalculated: ecart1.calculatedScore,
        newCalculated: ecart2.calculatedScore,
        delta: ecart2.calculatedScore - ecart1.calculatedScore,
        oldEcart: ecart1.ecart,
        newEcart: ecart2.ecart,
      });
    }
  });

  return diffs;
}

function formatDifferences(differences) {
  const lines = [];

  lines.push("=".repeat(80));
  lines.push("RAPPORT DE COMPARAISON DES COMMITS");
  lines.push("=".repeat(80));
  lines.push("");

  if (differences.length === 0) {
    lines.push("Aucune différence détectée !");
    return lines.join("\n");
  }

  lines.push(`Nombre total de différences: ${differences.length}`);
  lines.push("");

  // Grouper par type
  const byType = differences.reduce((acc, diff) => {
    if (!acc[diff.type]) acc[diff.type] = [];
    acc[diff.type].push(diff);
    return acc;
  }, {});

  Object.entries(byType).forEach(([type, diffs]) => {
    lines.push("");
    lines.push("-".repeat(80));
    lines.push(`TYPE: ${type} (${diffs.length} occurrences)`);
    lines.push("-".repeat(80));
    lines.push("");

    diffs.forEach((diff) => {
      lines.push(`Test Case: ${diff.testCaseId}`);

      if (diff.type === "FIXTURE_INPUT_CHANGED") {
        lines.push("  ⚠️ LA FIXTURE INPUT A CHANGÉ:");
        lines.push(`    Hash ancien: ${diff.oldHash}`);
        lines.push(`    Hash nouveau: ${diff.newHash}`);
        lines.push("  Différences détaillées:");
        diff.details.forEach((d) => {
          lines.push(
            `    ${d.path}: ${JSON.stringify(d.oldValue)} → ${JSON.stringify(d.newValue)} (${d.type})`,
          );
        });
      } else if (diff.type === "FIXTURE_EXPECTED_CHANGED") {
        lines.push("  ⚠️ LES VALEURS ATTENDUES DE LA FIXTURE ONT CHANGÉ:");
        lines.push(`    Hash ancien: ${diff.oldHash}`);
        lines.push(`    Hash nouveau: ${diff.newHash}`);
        lines.push("  Différences détaillées:");
        diff.details.forEach((d) => {
          if (d.type === "EXPECTED_SCORE_CHANGED") {
            lines.push(
              `    ${d.usage}: score attendu ${d.oldScore}% → ${d.newScore}% (Δ ${d.delta > 0 ? "+" : ""}${d.delta}%)`,
            );
          } else if (d.type === "EXPECTED_RANK_CHANGED") {
            lines.push(`    ${d.usage}: rang attendu ${d.oldRank} → ${d.newRank}`);
          }
        });
      } else if (diff.type === "INPUT_DIFF") {
        lines.push("  Différences dans les inputs:");
        diff.details.forEach((d) => {
          lines.push(`    ${d.path}: ${d.oldValue} → ${d.newValue} (${d.type})`);
        });
      } else if (diff.type === "CALCULATION_DIFF") {
        lines.push("  Différences dans les calculs:");
        diff.details.forEach((d) => {
          if (d.type === "STEP_DATA_CHANGED") {
            lines.push(`    Étape ${d.step} (${d.stepName}):`);
            d.changes.forEach((c) => {
              lines.push(
                `      ${c.path}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`,
              );
            });
          } else {
            lines.push(`    ${JSON.stringify(d)}`);
          }
        });
      } else if (diff.type === "OUTPUT_DIFF") {
        lines.push("  Différences dans les outputs:");
        diff.details.forEach((d) => {
          if (d.type === "SCORE_CHANGED") {
            lines.push(
              `    ${d.usage}: score ${d.oldScore}% → ${d.newScore}% (Δ ${d.delta > 0 ? "+" : ""}${d.delta.toFixed(1)}%)`,
            );
          } else if (d.type === "RANK_CHANGED") {
            lines.push(`    ${d.usage}: rang ${d.oldRank} → ${d.newRank}`);
          }
        });
      } else if (diff.type === "SCORE_DIFF") {
        lines.push("  Différences dans les scores calculés:");
        diff.details.forEach((d) => {
          lines.push(
            `    ${d.usage}: ${d.oldCalculated}% → ${d.newCalculated}% (Δ ${d.delta > 0 ? "+" : ""}${d.delta.toFixed(1)}%)`,
          );
          lines.push(
            `      Écart avec attendu: ${d.oldEcart.toFixed(2)}% → ${d.newEcart.toFixed(2)}%`,
          );
        });
      }

      lines.push("");
    });
  });

  return lines.join("\n");
}

// Point d'entrée
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error("Usage: node compare-fixture-logs.js <good-log.json> <bad-log.json>");
  process.exit(1);
}

const [goodLogPath, badLogPath] = args;

if (!fs.existsSync(goodLogPath)) {
  console.error(`Fichier introuvable: ${goodLogPath}`);
  process.exit(1);
}

if (!fs.existsSync(badLogPath)) {
  console.error(`Fichier introuvable: ${badLogPath}`);
  process.exit(1);
}

const differences = compareFixtureLogs(goodLogPath, badLogPath);
const report = formatDifferences(differences);

console.log(report);

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), "comparison-report.txt");
fs.writeFileSync(reportPath, report);
console.log(`\nRapport sauvegardé dans: ${reportPath}`);
