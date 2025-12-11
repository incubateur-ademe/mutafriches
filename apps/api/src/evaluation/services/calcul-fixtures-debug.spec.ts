import { describe, it, beforeAll } from "vitest";
import { CalculService } from "./calcul.service";
import { testCases } from "@mutafriches/shared-types";
import { FixtureDebugLogger } from "../__test-helpers__/fixture-debug-logger";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { Parcelle } from "../entities/parcelle.entity";
import * as path from "path";

describe("Debug - Génération des logs détaillés", () => {
  let calculService: CalculService;
  let logger: FixtureDebugLogger;

  beforeAll(() => {
    const fiabiliteCalculator = new FiabiliteCalculator();
    calculService = new CalculService(fiabiliteCalculator);
    logger = new FixtureDebugLogger();
  });

  it("devrait générer les logs de debug pour tous les test cases", async () => {
    console.log("\nGénération des logs de debug...\n");

    for (const testCase of testCases) {
      console.log(`Traitement de ${testCase.id}...`);

      // Démarrer le log pour ce test case
      logger.startTestCase(testCase);

      // Convertir le test case en Parcelle
      const parcelle = convertTestCaseToParcelle(testCase);
      logger.logNormalizedInput({
        testCaseInput: testCase.input,
        parcelleEntity: parcelle,
      });

      // Log: Critères extraits
      const criteres = (calculService as any).extraireCriteres(parcelle);
      logger.logCalculationStep("Critères extraits de la parcelle", criteres);

      // Log: Calcul des scores pour chaque usage avec calcul d'indice
      const usageTypes = [
        "residentiel",
        "equipements",
        "culture",
        "tertiaire",
        "industrie",
        "renaturation",
        "photovoltaique",
      ];

      const calculIntermediaires: any[] = [];

      usageTypes.forEach((usage) => {
        const scoreData = (calculService as any).calculerScorePourUsageDetaille(
          parcelle,
          usage as any,
        );

        // Calculer l'indice comme dans le service
        const { avantages, contraintes } = scoreData;
        const indice =
          avantages + contraintes === 0
            ? 0
            : Math.round((avantages / (avantages + contraintes)) * 1000) / 10;

        const detailUsage = {
          usage,
          avantages,
          contraintes,
          indice,
          formule: `(${avantages} / (${avantages} + ${contraintes})) * 100 = ${indice}%`,
          detailsAvantages: scoreData.detailsAvantages,
          detailsContraintes: scoreData.detailsContraintes,
          detailsCriteresVides: scoreData.detailsCriteresVides,
        };

        calculIntermediaires.push(detailUsage);

        logger.logCalculationStep(`Score détaillé pour usage ${usage}`, detailUsage);
      });

      // Log: Synthèse des calculs intermédiaires
      logger.logCalculationStep("Synthèse des calculs avant classement", {
        usages: calculIntermediaires.map((c) => ({
          usage: c.usage,
          indice: c.indice,
          avantages: c.avantages,
          contraintes: c.contraintes,
        })),
      });

      // Calculer la mutabilité
      const result = await calculService.calculer(parcelle, {
        modeDetaille: true,
      });

      // Transformer le résultat pour matcher le format attendu
      const transformedResult = {
        usages: result.resultats.map((r) => ({
          usage: r.usage,
          indiceMutabilite: r.indiceMutabilite,
          rang: r.rang,
        })),
        fiabilite: result.fiabilite,
      };

      // Log: Résultat du calcul
      logger.logOutput(transformedResult as any);

      // Log: Comparaison avec les valeurs attendues
      logger.logComparison(testCase, transformedResult as any);

      // Terminer le log pour ce test case
      logger.endTestCase();
    }

    // Sauvegarder les logs
    const outputPath = path.join(process.cwd(), "debug-logs", "fixtures-debug.json");
    logger.saveToFile(outputPath);

    // Afficher le résumé
    const summary = logger.getSummary();
    console.log("\n=== RÉSUMÉ ===");
    console.log(`Tests exécutés: ${summary.totalTests}`);
    console.log(`Tests problématiques: ${summary.problematicTests}`);
    if (summary.problematicTests > 0) {
      console.log("\nDétails des tests problématiques:");
      summary.details.forEach((detail) => {
        console.log(`  - ${detail.testCaseId}: écart max ${detail.maxEcart.toFixed(2)}%`);
      });
    }
    console.log("==============\n");
  });
});

/**
 * Convertit un TestCase en entité Parcelle
 */
function convertTestCaseToParcelle(testCase: any): Parcelle {
  const parcelle = new Parcelle();

  // Mapper les champs du test case vers la parcelle
  parcelle.identifiantParcelle = testCase.input.identifiantParcelle || "test-parcelle";
  parcelle.commune = testCase.input.commune;
  parcelle.surfaceSite = testCase.input.surfaceSite;
  parcelle.surfaceBati = testCase.input.surfaceBati;
  parcelle.typeProprietaire = testCase.input.typeProprietaire;
  parcelle.raccordementEau = testCase.input.raccordementEau;
  parcelle.etatBatiInfrastructure = testCase.input.etatBatiInfrastructure;
  parcelle.presencePollution = testCase.input.presencePollution;
  parcelle.valeurArchitecturaleHistorique = testCase.input.valeurArchitecturaleHistorique;
  parcelle.qualitePaysage = testCase.input.qualitePaysage;
  parcelle.qualiteVoieDesserte = testCase.input.qualiteVoieDesserte;
  parcelle.siteEnCentreVille = testCase.input.siteEnCentreVille;
  parcelle.distanceAutoroute = testCase.input.distanceAutoroute;
  parcelle.distanceTransportCommun = testCase.input.distanceTransportCommun;
  parcelle.proximiteCommercesServices = testCase.input.proximiteCommercesServices;
  parcelle.distanceRaccordementElectrique = testCase.input.distanceRaccordementElectrique;
  parcelle.tauxLogementsVacants = testCase.input.tauxLogementsVacants;
  parcelle.presenceRisquesTechnologiques = testCase.input.presenceRisquesTechnologiques;
  parcelle.presenceRisquesNaturels = testCase.input.presenceRisquesNaturels;
  parcelle.zonageEnvironnemental = testCase.input.zonageEnvironnemental;
  parcelle.zonageReglementaire = testCase.input.zonageReglementaire;
  parcelle.zonagePatrimonial = testCase.input.zonagePatrimonial;
  parcelle.trameVerteEtBleue = testCase.input.trameVerteEtBleu;

  return parcelle;
}
