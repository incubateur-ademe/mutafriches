import { describe, it, expect, beforeEach } from "vitest";
import { CalculService } from "./calcul.service";
import {
  testCases,
  convertTestCaseToMutabilityInput,
  type UsageResultatDetaille,
} from "@mutafriches/shared-types";

describe("CalculService - Validation des fixtures", () => {
  let calculService: CalculService;

  beforeEach(() => {
    calculService = new CalculService();
  });

  describe("Validation des écarts", () => {
    it.each(testCases)("$id - écart < 1% pour tous les usages", async (testCase) => {
      // Convertir le test case en format d'entrée
      const input = convertTestCaseToMutabilityInput(testCase);

      // Créer une instance de Parcelle avec les données
      const parcelle = {
        ...input.donneesEnrichies,
        ...input.donneesComplementaires,
      } as any;

      // Désactiver les logs du service pour ce test
      const originalLog = console.log;
      console.log = () => {};

      // Calculer avec la méthode du service
      const result = await calculService.calculer(parcelle, { modeDetaille: true });

      // Restaurer console.log
      console.log = originalLog;

      // Vérifier chaque usage
      const problemes: string[] = [];

      testCase.expected.usages.forEach((expectedUsage) => {
        const calculatedUsage = (result.resultats as UsageResultatDetaille[]).find(
          (r) => r.usage === expectedUsage.usage,
        );

        if (!calculatedUsage) {
          problemes.push(`Usage ${expectedUsage.usage} non trouvé dans les résultats`);
          return;
        }

        const ecart = Math.abs(calculatedUsage.indiceMutabilite - expectedUsage.indiceMutabilite);

        if (ecart > 1) {
          problemes.push(
            `${expectedUsage.usage}: écart ${ecart.toFixed(1)}% ` +
              `(calculé: ${calculatedUsage.indiceMutabilite}%, attendu: ${expectedUsage.indiceMutabilite}%)`,
          );
        }
      });

      // Le test échoue s'il y a des problèmes
      expect(problemes).toHaveLength(0);
    });
  });

  describe("Analyse globale", () => {
    it("devrait avoir un écart moyen < 1%", async () => {
      const toutsLesEcarts: number[] = [];
      let nbCasProblematiques = 0;

      // Désactiver les logs du service
      const originalLog = console.log;
      console.log = () => {};

      for (const testCase of testCases) {
        const input = convertTestCaseToMutabilityInput(testCase);
        const parcelle = {
          ...input.donneesEnrichies,
          ...input.donneesComplementaires,
        } as any;

        const result = await calculService.calculer(parcelle, { modeDetaille: true });
        let maxEcartCas = 0;

        testCase.expected.usages.forEach((expectedUsage) => {
          const calculatedUsage = (result.resultats as UsageResultatDetaille[]).find(
            (r) => r.usage === expectedUsage.usage,
          );

          if (calculatedUsage) {
            const ecart = Math.abs(
              calculatedUsage.indiceMutabilite - expectedUsage.indiceMutabilite,
            );
            toutsLesEcarts.push(ecart);
            maxEcartCas = Math.max(maxEcartCas, ecart);
          }
        });

        if (maxEcartCas > 1) {
          nbCasProblematiques++;
        }
      }

      // Restaurer console.log
      console.log = originalLog;

      const ecartMoyen = toutsLesEcarts.reduce((sum, e) => sum + e, 0) / toutsLesEcarts.length;
      const ecartMax = Math.max(...toutsLesEcarts);

      console.error("\n=== SYNTHESE ===");
      console.error(`Ecart moyen: ${ecartMoyen.toFixed(2)}%`);
      console.error(`Ecart max: ${ecartMax.toFixed(2)}%`);
      console.error(`Cas problematiques (>1%): ${nbCasProblematiques}/${testCases.length}`);
      console.error("================\n");

      expect(ecartMoyen).toBeLessThanOrEqual(1);
    });

    it("devrait analyser les changements de rangs", async () => {
      const changementsRangs: Array<{
        cas: string;
        usage: string;
        rangCalcule: number;
        rangAttendu: number;
        ecartRang: number;
      }> = [];

      // Désactiver les logs du service
      const originalLog = console.log;
      console.log = () => {};

      for (const testCase of testCases) {
        const input = convertTestCaseToMutabilityInput(testCase);
        const parcelle = {
          ...input.donneesEnrichies,
          ...input.donneesComplementaires,
        } as any;

        const result = await calculService.calculer(parcelle, { modeDetaille: true });

        // Comparer les rangs
        testCase.expected.usages.forEach((expectedUsage) => {
          const calculatedUsage = (result.resultats as UsageResultatDetaille[]).find(
            (r) => r.usage === expectedUsage.usage,
          );

          if (calculatedUsage && calculatedUsage.rang !== expectedUsage.rang) {
            changementsRangs.push({
              cas: testCase.id,
              usage: expectedUsage.usage,
              rangCalcule: calculatedUsage.rang,
              rangAttendu: expectedUsage.rang,
              ecartRang: calculatedUsage.rang - expectedUsage.rang,
            });
          }
        });
      }

      // Restaurer console.log
      console.log = originalLog;

      // Afficher l'analyse des changements de rang
      console.log("\n=== CHANGEMENTS DE RANGS ===");

      if (changementsRangs.length === 0) {
        console.log("Aucun changement de rang detecte - Parfait!");
      } else {
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
          console.log(`\n${cas}:`);
          changements
            .sort((a, b) => Math.abs(b.ecartRang) - Math.abs(a.ecartRang))
            .forEach((ch) => {
              const direction = ch.ecartRang > 0 ? "↓" : "↑";
              console.log(
                `  ${ch.usage}: rang ${ch.rangAttendu} → ${ch.rangCalcule} ` +
                  `(${direction}${Math.abs(ch.ecartRang)} position${Math.abs(ch.ecartRang) > 1 ? "s" : ""})`,
              );
            });
        });

        const totalChangements = changementsRangs.length;
        const moyenneEcart =
          changementsRangs.reduce((sum, ch) => sum + Math.abs(ch.ecartRang), 0) / totalChangements;

        console.log(`\n--------------------------`);
        console.log(`Total changements: ${totalChangements}`);
        console.log(`Ecart moyen de rang: ${moyenneEcart.toFixed(1)} positions`);
      }

      console.log("=============================\n");

      // Ce test est informatif uniquement
      expect(true).toBe(true);
    });
  });
});
