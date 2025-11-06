import { describe, it, expect, beforeEach } from "vitest";
import { CalculService } from "./calcul.service";
import { testCases } from "@mutafriches/shared-types";
import {
  executeTestCase,
  analyzeGlobalResults,
  formatRankChangesReport,
  VALIDATION_THRESHOLDS,
  type TestCaseValidation,
} from "../__test-helpers__/fixtures.helpers";

describe("CalculService - Validation des fixtures", () => {
  let calculService: CalculService;

  beforeEach(() => {
    vi.clearAllMocks();

    calculService = new CalculService();
  });

  describe("Validation individuelle des test cases", () => {
    it.each(testCases)(
      "$id - écart < 1.5% pour tous les usages",
      async (testCase) => {
        // Exécuter le test
        const validation = await executeTestCase(calculService, testCase);

        // Vérifier qu'il n'y a pas de problèmes
        if (validation.problems.length > 0) {
          console.error(`\nProblèmes détectés pour ${testCase.id}:`);
          validation.problems.forEach((problem) => console.error(`  - ${problem}`));
        }

        expect(validation.problems).toHaveLength(0);
      },
      { timeout: 10000 },
    );
  });

  describe("Analyse globale", () => {
    let allValidations: TestCaseValidation[];

    beforeEach(async () => {
      vi.clearAllMocks();

      // Exécuter tous les tests en une fois
      allValidations = await Promise.all(
        testCases.map((testCase) => executeTestCase(calculService, testCase)),
      );
    });

    it("devrait avoir un écart moyen < 1%", () => {
      const analysis = analyzeGlobalResults(allValidations);

      console.log("\n=== SYNTHESE ===");
      console.log(`Ecart moyen: ${analysis.avgEcart.toFixed(2)}%`);
      console.log(`Ecart max: ${analysis.maxEcart.toFixed(2)}%`);
      console.log(
        `Cas problematiques (>${VALIDATION_THRESHOLDS.MAX_ECART_USAGE}%): ${analysis.problematicTests}/${analysis.totalTests}`,
      );
      console.log("================\n");

      // Le test échoue si l'écart moyen dépasse 1%
      expect(analysis.avgEcart).toBeLessThanOrEqual(VALIDATION_THRESHOLDS.MAX_ECART_MOYEN);
    });

    it("ne devrait pas avoir d'écarts critiques (>5%)", () => {
      const analysis = analyzeGlobalResults(allValidations);

      const casCritiques = Array.from(analysis.ecartsByTest.entries())
        .filter(([, ecart]) => ecart > VALIDATION_THRESHOLDS.ECART_CRITIQUE)
        .map(([testId, ecart]) => ({ testId, ecart }));

      if (casCritiques.length > 0) {
        console.error("\n⚠️ CAS CRITIQUES DÉTECTÉS:");
        casCritiques.forEach(({ testId, ecart }) => {
          console.error(`  - ${testId}: écart de ${ecart.toFixed(1)}%`);
        });
        console.error("");
      }

      // Le test échoue s'il y a des écarts critiques
      expect(casCritiques).toHaveLength(0);
    });

    it("ne devrait pas avoir de changements de rangs significatifs", () => {
      // Compter les changements de rangs
      const changementsSignificatifs = allValidations.filter((validation) => {
        return validation.usageComparisons.some((comparison) => {
          const ecartRang = Math.abs(comparison.rangCalcule - comparison.rangAttendu);
          return ecartRang > 1;
        });
      });

      const report = formatRankChangesReport(allValidations);

      const changementsExtremesGraves = allValidations.filter((validation) => {
        return validation.usageComparisons.some((comparison) => {
          const ecartRang = Math.abs(comparison.rangCalcule - comparison.rangAttendu);
          return ecartRang > 2;
        });
      });

      // CONSTRUIRE UN MESSAGE D'ERREUR DÉTAILLÉ
      if (changementsExtremesGraves.length > 0) {
        const details = changementsExtremesGraves.map((v) => {
          const bigChanges = v.usageComparisons
            .filter((c) => Math.abs(c.rangCalcule - c.rangAttendu) > 2)
            .map((c) => {
              const ecartRang = Math.abs(c.rangCalcule - c.rangAttendu);
              return `    ${c.usage}: rang ${c.rangAttendu} → ${c.rangCalcule} (écart: ${ecartRang} positions)`;
            });
          return `  ${v.testCaseId}:\n${bigChanges.join("\n")}`;
        });

        const errorMessage = [
          "\n",
          "⚠️ CHANGEMENTS DE RANGS > 2 POSITIONS DÉTECTÉS:",
          "",
          ...details,
          "",
          `Total: ${changementsExtremesGraves.length}/10 cas problématiques`,
          "",
          "=== TOUS LES CHANGEMENTS DE RANGS ===",
          report,
          "=====================================",
          "",
        ].join("\n");

        //  Fail avec le message détaillé
        expect(changementsExtremesGraves, errorMessage).toHaveLength(0);
      } else {
        // Succès - Afficher quand même les stats
        const allChanges = allValidations.filter((v) => v.hasRankChanges);
        console.error("\n✅ Aucun changement > 2 positions");
        console.error(`   Mais ${allChanges.length}/10 cas ont des changements ≤ 2 positions\n`);

        expect(changementsExtremesGraves).toHaveLength(0);
      }
    });

    it("tous les usages devraient avoir un rang cohérent", () => {
      // Vérifier que les rangs sont séquentiels (1 à 7)
      const rangsIncorrects: Array<{
        testId: string;
        usage: string;
        rang: number;
        probleme: string;
      }> = [];

      allValidations.forEach((validation) => {
        const rangsCalcules = validation.usageComparisons.map((c) => c.rangCalcule).sort();

        // Vérifier que tous les rangs de 1 à 7 sont présents
        for (let i = 1; i <= 7; i++) {
          if (!rangsCalcules.includes(i)) {
            rangsIncorrects.push({
              testId: validation.testCaseId,
              usage: "N/A",
              rang: i,
              probleme: `Rang ${i} manquant`,
            });
          }
        }

        // Vérifier qu'il n'y a pas de doublons
        const uniqueRangs = new Set(rangsCalcules);
        if (uniqueRangs.size !== rangsCalcules.length) {
          const duplicates = rangsCalcules.filter(
            (rang, index) => rangsCalcules.indexOf(rang) !== index,
          );
          duplicates.forEach((rang) => {
            rangsIncorrects.push({
              testId: validation.testCaseId,
              usage: "N/A",
              rang,
              probleme: `Rang ${rang} en doublon`,
            });
          });
        }
      });

      if (rangsIncorrects.length > 0) {
        console.error("\n⚠️ PROBLÈMES DE RANGS DÉTECTÉS:");
        rangsIncorrects.forEach(({ testId, rang, probleme }) => {
          console.error(`  - ${testId}: ${probleme} (rang ${rang})`);
        });
        console.error("");
      }

      // Le test échoue si les rangs ne sont pas cohérents
      expect(rangsIncorrects).toHaveLength(0);
    });

    it("devrait avoir moins de 3 cas problématiques", () => {
      const analysis = analyzeGlobalResults(allValidations);

      // Lister les cas problématiques
      const casProblematiques = Array.from(analysis.ecartsByTest.entries())
        .filter(([, ecart]) => ecart > VALIDATION_THRESHOLDS.MAX_ECART_USAGE)
        .map(([testId, ecart]) => ({ testId, ecart }))
        .sort((a, b) => b.ecart - a.ecart);

      if (casProblematiques.length > 0) {
        console.log("\n⚠️ CAS PROBLÉMATIQUES (écart > 1.5%):");
        casProblematiques.forEach(({ testId, ecart }) => {
          console.log(`  - ${testId}: écart max de ${ecart.toFixed(2)}%`);
        });
        console.log("");
      }

      //  Maximum 3 cas problématiques autorisés (seuil de tolérance)
      expect(casProblematiques.length).toBeLessThanOrEqual(3);
    });

    it("aucun usage ne devrait avoir un écart > 3%", () => {
      const usagesProblematiques: Array<{
        testId: string;
        usage: string;
        ecart: number;
        calculated: number;
        expected: number;
      }> = [];

      allValidations.forEach((validation) => {
        validation.usageComparisons.forEach((comparison) => {
          if (comparison.ecart > 3) {
            usagesProblematiques.push({
              testId: validation.testCaseId,
              usage: comparison.usage,
              ecart: comparison.ecart,
              calculated: comparison.calculated,
              expected: comparison.expected,
            });
          }
        });
      });

      if (usagesProblematiques.length > 0) {
        console.error("\n⚠️ USAGES AVEC ÉCARTS > 3%:");
        usagesProblematiques
          .sort((a, b) => b.ecart - a.ecart)
          .forEach(({ testId, usage, ecart, calculated, expected }) => {
            console.error(
              `  - ${testId} / ${usage}: ${ecart.toFixed(1)}% (calculé: ${calculated}%, attendu: ${expected}%)`,
            );
          });
        console.error("");
      }

      // Aucun usage ne doit dépasser 3% d'écart
      expect(usagesProblematiques).toHaveLength(0);
    });
  });
});
