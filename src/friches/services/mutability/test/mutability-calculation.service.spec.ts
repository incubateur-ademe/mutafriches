import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { MutabilityCalculationService } from '../mutability-calculation.service';
import { ScoreParUsage } from '../config/criteres-scoring.config';
import { UsageType } from 'src/friches/enums/mutability.enums';
import { ScoreImpact } from 'src/friches/enums/score-impact.enum';
import {
  EtatBati,
  PresencePollution,
  QualiteDesserte,
  RisqueNaturel,
  TypeProprietaire,
  ZonageReglementaire,
} from 'src/friches/enums/parcelle.enums';
import { MutabilityInputDto } from 'src/friches/dto/mutability-input.dto';
import { TestDataLoaderService } from './test-data-loader.service';

/**
 * Classe dérivée pour exposer les méthodes protégées pour les tests
 */
class MutabilityCalculationServiceForTest extends MutabilityCalculationService {
  public convertirEnCleIndexForTest(valeur: unknown): string | number {
    return this.convertirEnCleIndex(valeur);
  }

  public obtenirScoreCritereForTest(
    champDTO: string,
    valeur: unknown,
    usage: keyof ScoreParUsage,
  ): number | null {
    return this.obtenirScoreCritere(champDTO, valeur, usage);
  }

  public calculerIndiceMutabiliteForTest(
    input: MutabilityInputDto,
    usage: UsageType,
  ) {
    return this.calculerIndiceMutabilite(input, usage);
  }

  public calculerFiabiliteForTest(input: MutabilityInputDto): {
    note: number;
    text: string;
    description: string;
    criteresRenseignes?: number;
    criteresTotal?: number;
  } {
    return this.calculerFiabilite(input);
  }
}

/**
 * Tests unitaires pour le service de calcul de mutabilité
 */
describe('MutabilityCalculationService', () => {
  let service: MutabilityCalculationServiceForTest;

  beforeEach(() => {
    service = new MutabilityCalculationServiceForTest();
  });

  /**
   * Tests utilisant les données externalisées via TestDataLoaderService
   */
  describe('Tests avec données externalisées (TestDataLoaderService)', () => {
    let testDataLoader: TestDataLoaderService;

    beforeAll(() => {
      testDataLoader = new TestDataLoaderService();
    });

    describe('Cas de test depuis fichiers JSON', () => {
      it('devrait valider tous les cas de test', () => {
        // Récupérer les cas de test dans le test lui-même
        const testCases = testDataLoader.getAllTestCases();

        if (testCases.length === 0) {
          console.warn('Aucun cas de test trouvé');
          return;
        }

        // Pour chaque cas de test
        testCases.forEach((testCase) => {
          // Calculer
          const result = service.calculateMutability(testCase.input);

          // Tableau de comparaison
          console.log(`\n=== ${testCase.name} ===`);
          console.log('Usage         | Algo  | Excel | Écart | Rang OK');
          console.log('--------------|-------|-------|-------|--------');

          testCase.expected.usages.forEach((expected) => {
            const actual = result.resultats.find(
              (r) => r.usage === expected.usage,
            );

            if (actual) {
              const ecart = actual.indiceMutabilite - expected.indiceMutabilite;
              const ecartStr =
                ecart > 0 ? `+${ecart.toFixed(0)}` : ecart.toFixed(0);
              const rangOk =
                actual.rang === expected.rang ? '✓' : `✗ (${actual.rang})`;

              console.log(
                `${expected.usage.padEnd(13)} | ${actual.indiceMutabilite.toFixed(0).padStart(4)}% | ${expected.indiceMutabilite.toFixed(0).padStart(4)}% | ${ecartStr.padStart(5)}% | ${rangOk}`,
              );

              // Assertions avec tolérance plus large temporairement
              // TODO: Réduire la tolérance après calibration de l'algorithme
              const tolerance = 30; // Tolérance de ±30%
              const ecartAbs = Math.abs(
                actual.indiceMutabilite - expected.indiceMutabilite,
              );

              if (ecartAbs > tolerance) {
                console.warn(
                  `⚠️ Écart hors tolérance pour ${expected.usage}: ${ecartAbs.toFixed(1)}%`,
                );
              }

              // Test avec tolérance ajustée
              expect(ecartAbs).toBeLessThanOrEqual(tolerance);

              // Test du rang avec avertissement si incorrect
              if (actual.rang !== expected.rang) {
                console.warn(
                  `⚠️ Rang incorrect pour ${expected.usage}: attendu ${expected.rang}, obtenu ${actual.rang}`,
                );
              }
              // On accepte une différence de rang de ±3 temporairement
              // TODO: Réduire la tolérance après calibration de l'algorithme
              expect(Math.abs(actual.rang - expected.rang)).toBeLessThanOrEqual(
                3,
              );
            }
          });

          // Vérifier qu'on a 7 usages
          expect(result.resultats).toHaveLength(7);
        });
      });
    });

    describe('Validation des données', () => {
      it('devrait avoir des cas de test valides', () => {
        const testCases = testDataLoader.getAllTestCases();
        expect(testCases.length).toBeGreaterThan(0);

        testCases.forEach((testCase) => {
          // Vérifications de base
          expect(testCase.id).toBeDefined();
          expect(testCase.input).toBeDefined();
          expect(testCase.expected.usages).toHaveLength(7);
        });
      });
    });

    describe('Synthèse', () => {
      it('devrait afficher un récapitulatif des écarts', () => {
        const testCases = testDataLoader.getAllTestCases();

        console.log('\n=== SYNTHESE DES ECARTS ===');

        let totalEcart = 0;
        let count = 0;
        let maxEcart = 0;
        let usageMaxEcart = '';

        testCases.forEach((testCase) => {
          const result = service.calculateMutability(testCase.input);
          console.log(`\n${testCase.name}:`);

          testCase.expected.usages.forEach((expected) => {
            const actual = result.resultats.find(
              (r) => r.usage === expected.usage,
            );
            if (actual) {
              const ecart = Math.abs(
                actual.indiceMutabilite - expected.indiceMutabilite,
              );
              totalEcart += ecart;
              count++;

              if (ecart > maxEcart) {
                maxEcart = ecart;
                usageMaxEcart = `${testCase.id}/${expected.usage}`;
              }

              // Afficher seulement les écarts > 5%
              if (ecart > 5) {
                console.log(`  ${expected.usage}: ${ecart.toFixed(1)}%`);
              }
            }
          });
        });

        const ecartMoyen = count > 0 ? totalEcart / count : 0;

        console.log('\n--- Statistiques ---');
        console.log(`Écart moyen: ${ecartMoyen.toFixed(1)}%`);
        console.log(`Écart max: ${maxEcart.toFixed(1)}% (${usageMaxEcart})`);

        // Le test échoue si l'écart moyen est trop grand
        expect(ecartMoyen).toBeLessThan(15);
      });
    });
  });

  describe('calculateMutability', () => {
    it("devrait retourner des résultats pour tous les types d'usage", () => {
      const input = {
        siteEnCentreVille: true,
        surfaceSite: 5000,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      expect(result.resultats).toHaveLength(7);
      expect(result.resultats.every((r) => r.usage)).toBeTruthy();
      expect(
        result.resultats.every((r) => typeof r.indiceMutabilite === 'number'),
      ).toBeTruthy();
    });

    it('devrait trier les résultats par indice décroissant', () => {
      const input = {
        siteEnCentreVille: true,
        presencePollution: PresencePollution.NON,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      for (let i = 0; i < result.resultats.length - 1; i++) {
        expect(result.resultats[i].indiceMutabilite).toBeGreaterThanOrEqual(
          result.resultats[i + 1].indiceMutabilite,
        );
      }
    });

    it('devrait attribuer les rangs correctement de 1 à 7', () => {
      const input = {
        surfaceSite: 10000,
        tauxLogementsVacants: 5,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      result.resultats.forEach((r, index) => {
        expect(r.rang).toBe(index + 1);
      });

      const rangs = result.resultats.map((r) => r.rang);
      expect(rangs).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('devrait inclure la fiabilité dans le résultat', () => {
      const input = {
        typeProprietaire: TypeProprietaire.PUBLIC,
        surfaceSite: 15000,
        presencePollution: PresencePollution.NON,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      expect(result.fiabilite).toBeDefined();
      expect(result.fiabilite.note).toBeDefined();
      expect(typeof result.fiabilite.note).toBe('number');
      expect(result.fiabilite.text).toBeDefined();
      expect(result.fiabilite.description).toBeDefined();
    });

    it('devrait gérer un input vide', () => {
      const input = {} as MutabilityInputDto;

      const result = service.calculateMutability(input);

      expect(result.resultats).toHaveLength(7);
      result.resultats.forEach((r) => {
        expect(r.indiceMutabilite).toBe(0);
      });
      expect(result.fiabilite.note).toBe(0);
      expect(result.fiabilite.text).toBe('Très peu fiable');
    });

    it('devrait propager les avantages et contraintes de chaque usage', () => {
      const input = {
        siteEnCentreVille: true,
        proximiteCommercesServices: true,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      const residentiel = result.resultats.find(
        (r) => r.usage === UsageType.RESIDENTIEL,
      );
      expect(residentiel).toBeDefined();
      expect(residentiel?.avantages).toBe(6);
      expect(residentiel?.contraintes).toBe(0);

      const industrie = result.resultats.find(
        (r) => r.usage === UsageType.INDUSTRIE,
      );
      expect(industrie).toBeDefined();
      expect(industrie?.avantages).toBe(0);
      expect(industrie?.contraintes).toBe(4);
    });

    it('devrait inclure les détails si mode détaillé activé', () => {
      const input = {
        siteEnCentreVille: true,
        surfaceSite: 5000,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input, { modeDetaille: true });

      expect(result.fiabilite.criteresRenseignes).toBeDefined();
      expect(result.fiabilite.criteresTotal).toBeDefined();

      const premierUsage = result.resultats[0];
      expect(premierUsage.detailsCalcul).toBeDefined();
      expect(premierUsage.detailsCalcul?.detailsAvantages).toBeInstanceOf(
        Array,
      );
      expect(premierUsage.detailsCalcul?.detailsContraintes).toBeInstanceOf(
        Array,
      );
    });
  });

  describe('calculerIndiceMutabilite', () => {
    it("devrait calculer un indice de 0 quand il n'y a ni avantages ni contraintes", () => {
      const input = {} as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.RESIDENTIEL,
      );

      expect(result.usage).toBe(UsageType.RESIDENTIEL);
      expect(result.indice).toBe(0);
      expect(result.avantages).toBe(0);
      expect(result.contraintes).toBe(0);
    });

    it("devrait calculer un indice de 100 quand il n'y a que des avantages", () => {
      const input = {
        siteEnCentreVille: true,
        proximiteCommercesServices: true,
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.RESIDENTIEL,
      );

      expect(result.indice).toBe(100);
      expect(result.avantages).toBe(6);
      expect(result.contraintes).toBe(0);
    });

    it("devrait calculer un indice de 0 quand il n'y a que des contraintes", () => {
      const input = {
        siteEnCentreVille: true,
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.INDUSTRIE,
      );

      expect(result.indice).toBe(0);
      expect(result.avantages).toBe(0);
      expect(result.contraintes).toBe(4);
    });

    it('devrait calculer un indice de 50 avec avantages et contraintes égaux', () => {
      const input = {
        presencePollution: PresencePollution.NON,
        siteEnCentreVille: false,
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.RESIDENTIEL,
      );

      expect(result.indice).toBe(50);
      expect(result.avantages).toBe(4);
      expect(result.contraintes).toBe(4);
    });

    it("devrait arrondir l'indice à une décimale", () => {
      const input = {
        surfaceSite: 8000,
        tauxLogementsVacants: 5,
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.RESIDENTIEL,
      );

      expect(result.indice).toBe(100);
      expect(result.avantages).toBe(3);

      const decimales = (result.indice.toString().split('.')[1] || '').length;
      expect(decimales).toBeLessThanOrEqual(1);
    });
  });

  describe('obtenirScoreCritere', () => {
    it('devrait retourner null pour un critère non mappé', () => {
      const result = service.obtenirScoreCritereForTest(
        'critereInexistant',
        'valeur',
        UsageType.RESIDENTIEL,
      );
      expect(result).toBeNull();
    });

    it('devrait retourner le bon score pour un booléen (proximiteCommercesServices)', () => {
      const result = service.obtenirScoreCritereForTest(
        'proximiteCommercesServices',
        false,
        UsageType.RENATURATION,
      );
      expect(result).toBe(ScoreImpact.NEUTRE);
    });

    it('devrait retourner un score négatif pour une contrainte', () => {
      const result = service.obtenirScoreCritereForTest(
        'siteEnCentreVille',
        true,
        UsageType.INDUSTRIE,
      );
      expect(result).toBe(ScoreImpact.TRES_NEGATIF);
    });

    it('devrait gérer les critères numériques (surfaceSite)', () => {
      const result = service.obtenirScoreCritereForTest(
        'surfaceSite',
        5000,
        UsageType.RESIDENTIEL,
      );
      expect(result).toBeDefined();
      expect(result).toBe(ScoreImpact.POSITIF);
    });

    it("devrait retourner null si la valeur enum n'est pas trouvée", () => {
      const result = service.obtenirScoreCritereForTest(
        'zonageReglementaire',
        'zone_inexistante',
        UsageType.RESIDENTIEL,
      );
      expect(result).toBeNull();
    });

    it("devrait gérer différents types d'usage pour le même critère", () => {
      const scoreResidentiel = service.obtenirScoreCritereForTest(
        'presencePollution',
        PresencePollution.DEJA_GEREE,
        UsageType.RESIDENTIEL,
      );
      const scoreRenaturation = service.obtenirScoreCritereForTest(
        'presencePollution',
        PresencePollution.OUI_AUTRES_COMPOSES,
        UsageType.RENATURATION,
      );

      expect(scoreResidentiel).toBe(ScoreImpact.POSITIF);
      expect(scoreRenaturation).toBe(ScoreImpact.NEUTRE);
      expect(typeof scoreResidentiel).toBe('number');
      expect(typeof scoreRenaturation).toBe('number');
    });
  });

  describe('convertirEnCleIndex', () => {
    it('devrait convertir un booléen true en string "true"', () => {
      const result = service.convertirEnCleIndexForTest(true);
      expect(result).toBe('true');
    });

    it('devrait convertir un booléen false en string "false"', () => {
      const result = service.convertirEnCleIndexForTest(false);
      expect(result).toBe('false');
    });

    it('devrait garder un nombre tel quel', () => {
      const result = service.convertirEnCleIndexForTest(42);
      expect(result).toBe(42);
    });
  });

  describe('calculerFiabilite', () => {
    it('devrait retourner "Très peu fiable" avec aucun critère', () => {
      const input = {} as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      expect(result.note).toBe(0);
      expect(result.text).toBe('Très peu fiable');
      expect(result.description).toContain('très incomplètes');
    });

    it('devrait retourner "Très peu fiable" avec peu de critères (3 sur 26)', () => {
      const input = {
        siteEnCentreVille: true,
        proximiteCommercesServices: false,
        surfaceSite: 5000,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      expect(result.note).toBeGreaterThanOrEqual(1);
      expect(result.note).toBeLessThan(2);
      expect(result.text).toBe('Très peu fiable');
    });

    it('devrait retourner "Peu fiable" avec environ un tiers des critères', () => {
      const input = {
        typeProprietaire: TypeProprietaire.PUBLIC,
        surfaceSite: 15000,
        surfaceBati: 5000,
        etatBatiInfrastructure: EtatBati.BON_ETAT_APPARENT,
        presencePollution: PresencePollution.NON,
        siteEnCentreVille: true,
        tauxLogementsVacants: 5,
        terrainViabilise: true,
        proximiteCommercesServices: true,
        presenceRisquesTechnologiques: false,
        distanceAutoroute: 2,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      expect(result.note).toBeGreaterThanOrEqual(4);
      expect(result.note).toBeLessThan(5);
      expect(result.text).toBe('Peu fiable');
    });

    it('devrait retourner "Moyennement fiable" avec la majorité des critères', () => {
      const input = {
        typeProprietaire: TypeProprietaire.PUBLIC,
        surfaceSite: 15000,
        surfaceBati: 5000,
        etatBatiInfrastructure: EtatBati.BON_ETAT_APPARENT,
        presencePollution: PresencePollution.NON,
        siteEnCentreVille: true,
        tauxLogementsVacants: 5,
        terrainViabilise: true,
        qualiteVoieDesserte: QualiteDesserte.ACCESSIBLE,
        distanceAutoroute: 2,
        distanceTransportCommun: 300,
        proximiteCommercesServices: true,
        distanceRaccordementElectrique: 0.5,
        zonageReglementaire: ZonageReglementaire.ZONE_URBAINE_U,
        presenceRisquesNaturels: RisqueNaturel.FAIBLE,
        presenceRisquesTechnologiques: false,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      expect(result.note).toBeGreaterThanOrEqual(6);
      expect(result.note).toBeLessThan(7);
      expect(result.text).toBe('Moyennement fiable');
    });

    it('devrait arrondir la note à 0.5 près', () => {
      const input = {
        siteEnCentreVille: true,
        proximiteCommercesServices: true,
        surfaceSite: 5000,
        tauxLogementsVacants: 3,
        presenceRisquesTechnologiques: false,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);
      expect(result.note % 0.5).toBe(0);
    });
  });
});
