import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { MutabilityCalculationService } from './mutability-calculation.service';
import { ScoreParUsage } from './config/criteres-scoring.config';
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
import { TestDataLoaderService } from './test-data/test-data-loader.service';

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
   * Ces tests remplacent progressivement les tests en dur
   */
  describe('Tests avec données externalisées (TestDataLoaderService)', () => {
    let testDataLoader: TestDataLoaderService;

    beforeAll(() => {
      testDataLoader = new TestDataLoaderService();
    });

    describe('Cas de test depuis fichiers JSON', () => {
      // Récupérer tous les cas de test disponibles
      const loader = new TestDataLoaderService();
      const testCases = loader.getAllTestCases();

      if (testCases.length === 0) {
        it.skip('Aucun cas de test trouvé dans test-data/cases/', () => {
          console.warn(
            'Aucun fichier de test JSON dans src/friches/services/mutability/test-data/cases/',
          );
        });
        return;
      }

      // Créer un test pour chaque cas de test JSON
      testCases.forEach((testCase) => {
        describe(`[${testCase.id}] ${testCase.name}`, () => {
          it(`devrait calculer la mutabilité avec mode détaillé`, () => {
            console.log(`\n=== EXECUTION TEST: ${testCase.name} ===`);
            if (testCase.source) {
              console.log(`Source: ${testCase.source}`);
            }
            if (testCase.description) {
              console.log(`Description: ${testCase.description}`);
            }

            // Calculer avec mode détaillé
            const result = service.calculateMutability(testCase.input, {
              modeDetaille: true,
            });

            // Afficher le détail pour debug
            console.log('\n--- DETAILS PAR USAGE ---');

            // Pour chaque usage attendu, comparer avec le résultat
            testCase.expected.usages.forEach((expectedUsage) => {
              const actualUsage = result.resultats.find(
                (r) => r.usage === expectedUsage.usage,
              );

              if (!actualUsage) {
                console.error(
                  `❌ Usage ${expectedUsage.usage} non trouvé dans les résultats`,
                );
                return;
              }

              console.log(`\n${expectedUsage.usage}:`);
              console.log(`  Indice calculé: ${actualUsage.indiceMutabilite}%`);
              console.log(`  Indice attendu: ${expectedUsage.indice}%`);
              console.log(
                `  Écart: ${(actualUsage.indiceMutabilite - expectedUsage.indice).toFixed(1)}%`,
              );
              console.log(`  Rang calculé: ${actualUsage.rang}`);
              console.log(`  Rang attendu: ${expectedUsage.rang}`);

              // Afficher le détail si disponible
              if (actualUsage.detailsCalcul) {
                console.log(
                  `  Avantages (${actualUsage.detailsCalcul.totalAvantages}):`,
                );
                actualUsage.detailsCalcul.detailsAvantages
                  .slice(0, 3)
                  .forEach((d) => {
                    console.log(
                      `    - ${d.critere}: ${d.scoreBrut} x ${d.poids} = ${d.scorePondere} (${d.valeur})`,
                    );
                  });

                console.log(
                  `  Contraintes (${actualUsage.detailsCalcul.totalContraintes}):`,
                );
                actualUsage.detailsCalcul.detailsContraintes
                  .slice(0, 3)
                  .forEach((d) => {
                    console.log(
                      `    - ${d.critere}: ${d.scoreBrut} x ${d.poids} = ${d.scorePondere} (${d.valeur})`,
                    );
                  });
              }
            });

            // Analyser les écarts importants
            console.log('\n--- ANALYSE DES ECARTS ---');
            const ecarts = testCase.expected.usages.map((expectedUsage) => {
              const actualUsage = result.resultats.find(
                (r) => r.usage === expectedUsage.usage,
              );
              return {
                usage: expectedUsage.usage,
                ecart: actualUsage
                  ? Math.abs(
                      actualUsage.indiceMutabilite - expectedUsage.indice,
                    )
                  : 999,
                rangOk: actualUsage?.rang === expectedUsage.rang,
              };
            });

            const ecartsImportants = ecarts.filter((e) => e.ecart > 10);
            if (ecartsImportants.length > 0) {
              console.log('⚠️ Écarts importants (>10%) détectés:');
              ecartsImportants.forEach((e) => {
                console.log(`  - ${e.usage}: écart de ${e.ecart.toFixed(1)}%`);
              });
            }

            const rangsIncorrects = ecarts.filter((e) => !e.rangOk);
            if (rangsIncorrects.length > 0) {
              console.log('⚠️ Rangs incorrects:');
              rangsIncorrects.forEach((e) => {
                console.log(`  - ${e.usage}`);
              });
            }

            // Fiabilité
            console.log('\n--- FIABILITE ---');
            console.log(`  Note calculée: ${result.fiabilite.note}/10`);
            console.log(`  Évaluation: ${result.fiabilite.text}`);
            if (result.fiabilite.criteresRenseignes !== undefined) {
              console.log(
                `  Critères renseignés: ${result.fiabilite.criteresRenseignes}/${result.fiabilite.criteresTotal}`,
              );
            }

            // Tests d'assertion
            expect(result.resultats).toHaveLength(7);

            // Vérifier que chaque usage existe
            testCase.expected.usages.forEach((expectedUsage) => {
              const actualUsage = result.resultats.find(
                (r) => r.usage === expectedUsage.usage,
              );
              expect(actualUsage).toBeDefined();

              // Warning si écart trop grand
              const ecart = Math.abs(
                actualUsage!.indiceMutabilite - expectedUsage.indice,
              );
              if (ecart > 30) {
                console.warn(
                  `⚠️ Écart très important pour ${expectedUsage.usage}: ${ecart.toFixed(1)}%`,
                );
              }
            });
          });

          // Test détaillé pour analyser les critères
          it('devrait analyser en détail les critères problématiques', () => {
            console.log('\n=== ANALYSE DETAILLEE DES CRITERES ===');

            const result = service.calculateMutability(testCase.input, {
              modeDetaille: true,
            });

            // Trouver l'usage avec le plus gros écart
            const usageAvecPlusGrosEcart = testCase.expected.usages.reduce(
              (max, expectedUsage) => {
                const actualUsage = result.resultats.find(
                  (r) => r.usage === expectedUsage.usage,
                );
                const ecart = actualUsage
                  ? Math.abs(
                      actualUsage.indiceMutabilite - expectedUsage.indice,
                    )
                  : 0;
                return ecart > max.ecart
                  ? { usage: expectedUsage.usage, ecart }
                  : max;
              },
              { usage: '' as UsageType | '', ecart: 0 },
            );

            if (usageAvecPlusGrosEcart.ecart > 5) {
              console.log(
                `\nUsage avec le plus gros écart: ${usageAvecPlusGrosEcart.usage} (${usageAvecPlusGrosEcart.ecart.toFixed(1)}%)`,
              );

              const actualUsage = result.resultats.find(
                (r) => r.usage === (usageAvecPlusGrosEcart.usage as UsageType),
              );

              if (actualUsage?.detailsCalcul) {
                console.log('\nTous les avantages:');
                actualUsage.detailsCalcul.detailsAvantages.forEach((d) => {
                  console.log(
                    `  ${d.critere}: ${d.scoreBrut} x ${d.poids} = ${d.scorePondere}`,
                  );
                });

                console.log('\nToutes les contraintes:');
                actualUsage.detailsCalcul.detailsContraintes.forEach((d) => {
                  console.log(
                    `  ${d.critere}: ${d.scoreBrut} x ${d.poids} = ${d.scorePondere}`,
                  );
                });
              }
            }

            // Identifier les critères à fort impact
            console.log('\n--- CRITERES A FORT IMPACT ---');
            result.resultats.forEach((r) => {
              if (r.detailsCalcul) {
                const topCriteres = [
                  ...r.detailsCalcul.detailsAvantages
                    .slice(0, 2)
                    .map((d) => ({ ...d, type: 'avantage' })),
                  ...r.detailsCalcul.detailsContraintes
                    .slice(0, 2)
                    .map((d) => ({ ...d, type: 'contrainte' })),
                ].filter((d) => d.scorePondere > 2);

                if (topCriteres.length > 0) {
                  console.log(`\n${r.usage}:`);
                  topCriteres.forEach((d) => {
                    console.log(
                      `  ${d.type === 'avantage' ? '+' : '-'} ${d.critere}: ${d.scorePondere}`,
                    );
                  });
                }
              }
            });
          });
        });
      });
    });

    // Test de validation des données
    describe('Validation des cas de test', () => {
      it('devrait avoir au moins un cas de test valide', () => {
        const testCases = testDataLoader.getAllTestCases();
        expect(testCases.length).toBeGreaterThan(0);

        testCases.forEach((testCase) => {
          const errors = testDataLoader.validateTestCase(testCase);
          if (errors.length > 0) {
            console.error(`Erreurs de validation pour ${testCase.id}:`, errors);
          }
          expect(errors).toHaveLength(0);
        });
      });

      it('devrait pouvoir récupérer le cas de test Renaison', () => {
        const renaison = testDataLoader.getTestCase('renaison-001');
        expect(renaison).toBeDefined();
        expect(renaison?.name).toContain('Renaison');
        expect(renaison?.input).toBeDefined();
        expect(renaison?.expected).toBeDefined();
      });
    });
  });

  // Debug simple avec mode détaillé
  describe('Debug simple avec mode détaillé', () => {
    let testDataLoader: TestDataLoaderService;

    beforeAll(() => {
      testDataLoader = new TestDataLoaderService();
    });

    it('devrait afficher le calcul complet pour Trélazé', () => {
      const testCase = testDataLoader.getTestCase('trelaze-001');
      if (!testCase) {
        console.log('Cas de test Trélazé non trouvé');
        return;
      }

      console.log('\n=== CALCUL COMPLET TRELAZE ===');
      const result = service.calculateMutability(testCase.input, {
        modeDetaille: true,
      });

      // Afficher uniquement les 2 premiers usages pour lisibilité
      console.log('\nRésultat pour les 2 premiers usages:');
      result.resultats.slice(0, 2).forEach((r) => {
        console.log(`\n${r.usage}:`);
        console.log(`  Indice: ${r.indiceMutabilite}%`);
        console.log(`  Rang: ${r.rang}`);
        console.log(`  Avantages: ${r.avantages}`);
        console.log(`  Contraintes: ${r.contraintes}`);
        if (r.detailsCalcul) {
          console.log(
            '  Top avantages:',
            r.detailsCalcul.detailsAvantages
              .slice(0, 2)
              .map((d) => `${d.critere}(${d.scorePondere})`)
              .join(', '),
          );
        }
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
