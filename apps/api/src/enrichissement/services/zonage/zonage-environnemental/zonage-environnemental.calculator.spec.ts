import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ZonageEnvironnemental } from '@mutafriches/shared-types';
import { ZonageEnvironnementalCalculator } from './zonage-environnemental.calculator';
import {
  ResultatNatura2000,
  ResultatZnieff,
  ResultatParcNaturel,
  ResultatReserveNaturelle,
} from './zonage-environnemental.types';

describe('ZonageEnvironnementalCalculator', () => {
  let calculator: ZonageEnvironnementalCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZonageEnvironnementalCalculator],
    }).compile();

    calculator = module.get<ZonageEnvironnementalCalculator>(
      ZonageEnvironnementalCalculator,
    );
  });

  describe('evaluer', () => {
    describe('Priorité 1 - Natura 2000', () => {
      it('devrait retourner NATURA_2000 si présent (peu importe les autres)', () => {
        // Arrange
        const natura2000: ResultatNatura2000 = {
          present: true,
          nombreZones: 1,
        };
        const znieff: ResultatZnieff = {
          present: true,
          type1: true,
          type2: false,
          nombreZones: 1,
        };
        const parcNaturel: ResultatParcNaturel = {
          present: true,
          type: 'regional',
        };
        const reserve: ResultatReserveNaturelle = {
          present: true,
          nombreReserves: 1,
        };

        // Act
        const result = calculator.evaluer(natura2000, znieff, parcNaturel, reserve);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.NATURA_2000);
      });

      it('devrait retourner NATURA_2000 même si autres zones nulles', () => {
        // Arrange
        const natura2000: ResultatNatura2000 = {
          present: true,
          nombreZones: 2,
        };

        // Act
        const result = calculator.evaluer(natura2000, null, null, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.NATURA_2000);
      });
    });

    describe('Priorité 2 - ZNIEFF', () => {
      it('devrait retourner ZNIEFF_TYPE_1_2 si présente (sans Natura 2000)', () => {
        // Arrange
        const natura2000: ResultatNatura2000 = {
          present: false,
          nombreZones: 0,
        };
        const znieff: ResultatZnieff = {
          present: true,
          type1: true,
          type2: false,
          nombreZones: 1,
        };

        // Act
        const result = calculator.evaluer(natura2000, znieff, null, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.ZNIEFF_TYPE_1_2);
      });

      it('devrait retourner ZNIEFF même si parc naturel présent', () => {
        // Arrange
        const natura2000: ResultatNatura2000 = {
          present: false,
          nombreZones: 0,
        };
        const znieff: ResultatZnieff = {
          present: true,
          type1: false,
          type2: true,
          nombreZones: 1,
        };
        const parcNaturel: ResultatParcNaturel = {
          present: true,
          type: 'national',
        };

        // Act
        const result = calculator.evaluer(natura2000, znieff, parcNaturel, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.ZNIEFF_TYPE_1_2);
      });
    });

    describe('Priorité 3 - Parc Naturel', () => {
      it('devrait retourner PARC_NATUREL_NATIONAL si type national', () => {
        // Arrange
        const parcNaturel: ResultatParcNaturel = {
          present: true,
          type: 'national',
          nom: 'Parc National des Écrins',
        };

        // Act
        const result = calculator.evaluer(null, null, parcNaturel, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.PARC_NATUREL_NATIONAL);
      });

      it('devrait retourner PARC_NATUREL_REGIONAL si type regional', () => {
        // Arrange
        const parcNaturel: ResultatParcNaturel = {
          present: true,
          type: 'regional',
          nom: 'PNR du Morvan',
        };

        // Act
        const result = calculator.evaluer(null, null, parcNaturel, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.PARC_NATUREL_REGIONAL);
      });

      it('devrait retourner HORS_ZONE si parc présent mais type null', () => {
        // Arrange
        const parcNaturel: ResultatParcNaturel = {
          present: true,
          type: null,
        };

        // Act
        const result = calculator.evaluer(null, null, parcNaturel, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.HORS_ZONE);
      });
    });

    describe('Priorité 4 - Réserve Naturelle', () => {
      it('devrait retourner RESERVE_NATURELLE si présente', () => {
        // Arrange
        const reserve: ResultatReserveNaturelle = {
          present: true,
          nombreReserves: 1,
        };

        // Act
        const result = calculator.evaluer(null, null, null, reserve);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.RESERVE_NATURELLE);
      });

      it('devrait retourner RESERVE_NATURELLE même avec plusieurs réserves', () => {
        // Arrange
        const reserve: ResultatReserveNaturelle = {
          present: true,
          nombreReserves: 3,
        };

        // Act
        const result = calculator.evaluer(null, null, null, reserve);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.RESERVE_NATURELLE);
      });
    });

    describe('Aucun zonage', () => {
      it('devrait retourner HORS_ZONE si toutes les données sont null', () => {
        // Act
        const result = calculator.evaluer(null, null, null, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.HORS_ZONE);
      });

      it('devrait retourner HORS_ZONE si aucune zone présente', () => {
        // Arrange
        const natura2000: ResultatNatura2000 = {
          present: false,
          nombreZones: 0,
        };
        const znieff: ResultatZnieff = {
          present: false,
          type1: false,
          type2: false,
          nombreZones: 0,
        };
        const parcNaturel: ResultatParcNaturel = {
          present: false,
          type: null,
        };
        const reserve: ResultatReserveNaturelle = {
          present: false,
          nombreReserves: 0,
        };

        // Act
        const result = calculator.evaluer(natura2000, znieff, parcNaturel, reserve);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.HORS_ZONE);
      });
    });

    describe('Cas limites', () => {
      it('devrait gérer un résultat Natura 2000 avec 0 zone mais présent=true', () => {
        // Arrange - cas incohérent mais possible
        const natura2000: ResultatNatura2000 = {
          present: true,
          nombreZones: 0,
        };

        // Act
        const result = calculator.evaluer(natura2000, null, null, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.NATURA_2000);
      });

      it('devrait ignorer les résultats non-présents même avec des données', () => {
        // Arrange
        const znieff: ResultatZnieff = {
          present: false,
          type1: true, // Données présentes mais present=false
          type2: false,
          nombreZones: 1,
        };

        // Act
        const result = calculator.evaluer(null, znieff, null, null);

        // Assert
        expect(result).toBe(ZonageEnvironnemental.HORS_ZONE);
      });
    });
  });
});
