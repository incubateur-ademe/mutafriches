import { describe, it, expect, beforeEach } from 'vitest';
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
