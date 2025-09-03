import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { MutabilityCalculationService } from './mutability-calculation.service';
import { ScoreParUsage } from './config/criteres-scoring.config';
import { UsageType } from 'src/friches/enums/mutability.enums';
import {
  EtatBati,
  PresencePollution,
  QualiteDesserte,
  ReseauEaux,
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

  // À ajouter à la fin de mutability-calculation.service.spec.ts, juste avant la dernière accolade

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
          it(`devrait calculer la mutabilité conformément aux résultats attendus`, () => {
            // Afficher les infos du test
            console.log(`\n=== EXECUTION TEST: ${testCase.name} ===`);
            if (testCase.source) {
              console.log(`Source: ${testCase.source}`);
            }
            if (testCase.description) {
              console.log(`Description: ${testCase.description}`);
            }

            // Calculer les résultats
            const result = service.calculateMutability(testCase.input);

            // Comparer avec les résultats attendus
            console.log('\n--- Comparaison des résultats ---');

            // Vérifier qu'on a bien 7 résultats
            expect(result.resultats).toHaveLength(7);

            // Vérifier chaque usage
            testCase.expected.usages.forEach((expectedUsage) => {
              const actualUsage = result.resultats.find(
                (r) => r.rang === expectedUsage.rang,
              );

              expect(actualUsage).toBeDefined();
              expect(actualUsage!.usage).toBe(expectedUsage.usage);

              // Vérifier l'indice avec tolérance
              const tolerance = expectedUsage.tolerance || 1.5;
              const diff = Math.abs(
                actualUsage!.indiceMutabilite - expectedUsage.indiceMutabilite,
              );

              console.log(
                `${expectedUsage.rang}. ${expectedUsage.usage}: ` +
                  `calculé=${actualUsage!.indiceMutabilite}%, ` +
                  `attendu=${expectedUsage.indiceMutabilite}%, ` +
                  `écart=${diff.toFixed(1)}%`,
              );

              expect(diff).toBeLessThanOrEqual(tolerance);
            });

            // Vérifier la fiabilité
            console.log('\n--- Fiabilité ---');
            console.log(
              `Calculée: ${result.fiabilite.note}/10 (${result.fiabilite.text})`,
            );
            console.log(
              `Attendue: ${testCase.expected.fiabilite.note}/10 (${testCase.expected.fiabilite.text})`,
            );

            expect(result.fiabilite.text).toBe(
              testCase.expected.fiabilite.text,
            );

            // Vérifier la note de fiabilité avec tolérance
            if (
              testCase.expected.fiabilite.noteMin !== undefined &&
              testCase.expected.fiabilite.noteMax !== undefined
            ) {
              expect(result.fiabilite.note).toBeGreaterThanOrEqual(
                testCase.expected.fiabilite.noteMin,
              );
              expect(result.fiabilite.note).toBeLessThanOrEqual(
                testCase.expected.fiabilite.noteMax,
              );
            } else {
              const diff = Math.abs(
                result.fiabilite.note - testCase.expected.fiabilite.note,
              );
              expect(diff).toBeLessThanOrEqual(0.5);
            }
          });

          // Test optionnel pour debug détaillé (activé avec DEBUG_TESTS=true)
          if (process.env.DEBUG_TESTS === 'true') {
            it('devrait afficher le détail des calculs pour debug', () => {
              console.log(`\n=== DEBUG DÉTAILLÉ: ${testCase.name} ===`);

              const result = service.calculateMutability(testCase.input);

              result.resultats.forEach((r) => {
                console.log(
                  `\n${r.usage}:`,
                  `\n  Indice: ${r.indiceMutabilite}%`,
                  `\n  Avantages: ${r.avantages}`,
                  `\n  Contraintes: ${r.contraintes}`,
                  `\n  Ratio: ${r.avantages}/(${r.avantages}+${r.contraintes})`,
                );
              });

              // Afficher les critères non mappés si présents
              if (testCase.expected.metadata?.criteresNonMappes) {
                console.log(
                  '\nCritères non mappés:',
                  testCase.expected.metadata.criteresNonMappes.join(', '),
                );
              }
            });
          }
        });
      });
    });

    // Test de validation des données
    describe('Validation des cas de test', () => {
      it('devrait avoir au moins un cas de test valide', () => {
        const testCases = testDataLoader.getAllTestCases();
        expect(testCases.length).toBeGreaterThan(0);

        // Valider chaque cas
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

  // Ajouter également l'import en haut du fichier (après les autres imports) :
  // import { TestDataLoaderService } from './test-data/test-data-loader.service';

  describe('calculateMutability', () => {
    it("devrait retourner des résultats pour tous les types d'usage", () => {
      const input = {
        siteEnCentreVille: true,
        surfaceSite: 5000,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      expect(result.resultats).toHaveLength(7); // 7 types d'usage
      expect(result.resultats.every((r) => r.usage)).toBeTruthy();
      expect(
        result.resultats.every((r) => typeof r.indiceMutabilite === 'number'),
      ).toBeTruthy();
    });

    it('devrait trier les résultats par indice décroissant', () => {
      const input = {
        siteEnCentreVille: true, // Favorable au résidentiel, défavorable à l'industrie
        presencePollution: PresencePollution.NON,
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      // Vérifier que c'est trié par indice décroissant
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

      // Vérifier les rangs
      result.resultats.forEach((r, index) => {
        expect(r.rang).toBe(index + 1);
      });

      // Vérifier qu'on a bien les rangs de 1 à 7
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
      // Avec un input vide, tous les indices devraient être 0
      result.resultats.forEach((r) => {
        expect(r.indiceMutabilite).toBe(0);
      });
      // Fiabilité très faible
      expect(result.fiabilite.note).toBe(0);
      expect(result.fiabilite.text).toBe('Très peu fiable');
    });

    it('devrait propager les avantages et contraintes de chaque usage', () => {
      const input = {
        siteEnCentreVille: true, // +2 résidentiel (poids 2), -2 industrie (poids 2)
        proximiteCommercesServices: true, // +2 résidentiel (poids 1)
      } as MutabilityInputDto;

      const result = service.calculateMutability(input);

      // Trouver le résultat pour résidentiel
      const residentiel = result.resultats.find(
        (r) => r.usage === UsageType.RESIDENTIEL,
      );
      expect(residentiel).toBeDefined();

      // Trouver le résultat pour industrie
      const industrie = result.resultats.find(
        (r) => r.usage === UsageType.INDUSTRIE,
      );
      expect(industrie).toBeDefined();
      expect(industrie?.avantages).toBe(0.5); // 0.5*1 pour proximiteCommercesServices
      expect(industrie?.contraintes).toBe(4); // 2*2 pour siteEnCentreVille
    });
  });

  describe('calculerIndiceMutabilite', () => {
    it("devrait calculer un indice de 0 quand il n'y a ni avantages ni contraintes", () => {
      // Input vide ou avec des critères non mappés
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
      // Input avec seulement des critères favorables
      const input = {
        siteEnCentreVille: true, // +2 pour résidentiel (poids 2) = 4
        proximiteCommercesServices: true, // +2 pour résidentiel (poids 1) = 2
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.RESIDENTIEL,
      );

      expect(result.indice).toBe(100);
      expect(result.avantages).toBe(6); // 4 + 2
      expect(result.contraintes).toBe(0);
    });

    it("devrait calculer un indice de 0 quand il n'y a que des contraintes", () => {
      // Input avec seulement des critères défavorables pour l'industrie en centre-ville
      const input = {
        siteEnCentreVille: true, // -2 pour industrie (poids 2) = -4
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.INDUSTRIE,
      );

      expect(result.indice).toBe(0);
      expect(result.avantages).toBe(0);
      expect(result.contraintes).toBe(4); // valeur absolue de -4
    });

    it('devrait calculer un indice de 50 avec avantages et contraintes égaux', () => {
      // Input avec des scores équilibrés
      const input = {
        presencePollution: PresencePollution.NON, // +2 pour résidentiel (poids 2) = 4
        siteEnCentreVille: false, // -2 pour résidentiel (poids 2) = -4
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
      // Cas qui génère un résultat avec plusieurs décimales
      const input = {
        surfaceSite: 8000, // +1 pour résidentiel (poids 2) = 2
        tauxLogementsVacants: 5, // +1 pour résidentiel (poids 1) = 1
      } as MutabilityInputDto;

      const result = service.calculerIndiceMutabiliteForTest(
        input,
        UsageType.RESIDENTIEL,
      );

      // 3 / 3 = 100% → 100.0
      expect(result.indice).toBe(100);
      expect(result.avantages).toBe(3);

      // Vérifier que c'est bien un nombre avec au plus une décimale
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
      // Proximité des commerces/services = false pour usage renaturation
      const result = service.obtenirScoreCritereForTest(
        'proximiteCommercesServices',
        false,
        UsageType.RENATURATION,
      );
      expect(result).toBe(0.5);
    });

    it('devrait retourner un score négatif pour une contrainte', () => {
      // Site en centre-ville = true pour usage industrie (contraignant)
      const result = service.obtenirScoreCritereForTest(
        'siteEnCentreVille',
        true,
        UsageType.INDUSTRIE,
      );
      expect(result).toBeLessThan(0);
    });

    it('devrait gérer les critères numériques (surfaceParcelle)', () => {
      // Surface de 5000m² pour usage résidentiel
      const result = service.obtenirScoreCritereForTest(
        'surfaceSite',
        5000,
        UsageType.RESIDENTIEL,
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    it("devrait retourner null si la valeur enum n'est pas trouvée", () => {
      // Valeur d'enum invalide
      const result = service.obtenirScoreCritereForTest(
        'zonageReglementaire',
        'zone_inexistante',
        UsageType.RESIDENTIEL,
      );
      expect(result).toBeNull();
    });

    it("devrait gérer différents types d'usage pour le même critère", () => {
      // Présence de pollution déjà gérée pour usage résidentiel
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

      expect(scoreResidentiel).toBeDefined();
      expect(scoreRenaturation).toBeDefined();

      // Les scores peuvent être différents selon l'usage
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

    it('devrait retourner "Peu fiable" avec peu de critères (3-4 sur 21)', () => {
      const input = {
        siteEnCentreVille: true,
        proximiteCommercesServices: false,
        surfaceSite: 5000,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      // 3/21 = 14.3% → note = 1.5 arrondi
      expect(result.note).toBeGreaterThanOrEqual(1);
      expect(result.note).toBeLessThan(3);
      expect(result.text).toBe('Très peu fiable');
    });

    it('devrait retourner "Moyennement fiable" avec environ la moitié des critères', () => {
      const input = {
        typeProprietaire: TypeProprietaire.PUBLIC,
        surfaceSite: 15000,
        surfaceBati: 5000,
        etatBatiInfrastructure: EtatBati.BON_ETAT_APPARENT,
        presencePollution: PresencePollution.NON,
        siteEnCentreVille: true,
        tauxLogementsVacants: 5,
        reseauEaux: ReseauEaux.OUI,
        proximiteCommercesServices: true,
        presenceRisquesTechnologiques: false,
        distanceAutoroute: 2,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      // 11/21 = 52% → note = 5.2
      expect(result.note).toBeGreaterThanOrEqual(5);
      expect(result.note).toBeLessThan(7);
      expect(result.text).toBe('Moyennement fiable');
    });

    it('devrait retourner "Fiable" avec la plupart des critères', () => {
      // Créer un input avec 16-17 critères sur 21
      const input = {
        typeProprietaire: TypeProprietaire.PUBLIC,
        surfaceSite: 15000,
        surfaceBati: 5000,
        etatBatiInfrastructure: EtatBati.BON_ETAT_APPARENT,
        presencePollution: PresencePollution.NON,
        siteEnCentreVille: true,
        tauxLogementsVacants: 5,
        reseauEaux: ReseauEaux.OUI,
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

      // 16/21 = 76% → note = 7.6
      expect(result.note).toBeGreaterThanOrEqual(7);
      expect(result.note).toBeLessThan(9);
      expect(result.text).toBe('Fiable');
    });

    it('devrait arrondir la note à 0.5 près', () => {
      // 5 critères sur 21 = 23.8% → 2.38 → arrondi à 2.5
      const input = {
        siteEnCentreVille: true,
        proximiteCommercesServices: true,
        surfaceSite: 5000,
        tauxLogementsVacants: 3,
        presenceRisquesTechnologiques: false,
      } as MutabilityInputDto;

      const result = service.calculerFiabiliteForTest(input);

      // Vérifier que c'est un multiple de 0.5
      expect(result.note % 0.5).toBe(0);
    });
  });
});
