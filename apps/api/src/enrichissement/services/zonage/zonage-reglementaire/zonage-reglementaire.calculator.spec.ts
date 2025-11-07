import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ZonageReglementaire } from '@mutafriches/shared-types';
import { ZonageReglementaireCalculator } from './zonage-reglementaire.calculator';
import {
  ResultatZoneUrba,
  ResultatSecteurCC,
  InfoCommune,
} from './zonage-reglementaire.types';

describe('ZonageReglementaireCalculator', () => {
  let calculator: ZonageReglementaireCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZonageReglementaireCalculator],
    }).compile();

    calculator = module.get<ZonageReglementaireCalculator>(
      ZonageReglementaireCalculator,
    );
  });

  describe('evaluer', () => {
    describe('Priorité 1 - Zone PLU', () => {
      it('devrait retourner ZONE_URBAINE_U si typezone commence par U', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'U',
          libelle: 'Zone urbaine',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_URBAINE_U);
      });

      it('devrait retourner ZONE_URBAINE_U pour UA, UB, UC', () => {
        // Arrange & Act & Assert
        const zones = ['UA', 'UB', 'UC', 'Ue'];
        zones.forEach((typezone) => {
          const zoneUrba: ResultatZoneUrba = {
            present: true,
            nombreZones: 1,
            typezone,
          };
          expect(calculator.evaluer(zoneUrba, null, null)).toBe(
            ZonageReglementaire.ZONE_URBAINE_U,
          );
        });
      });

      it('devrait retourner ZONE_A_URBANISER_AU si typezone commence par AU', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'AU',
          libelle: 'Zone à urbaniser',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_A_URBANISER_AU);
      });

      it('devrait retourner ZONE_AGRICOLE_A si typezone commence par A', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'A',
          libelle: 'Zone agricole',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_AGRICOLE_A);
      });

      it('devrait retourner ZONE_NATURELLE_N si typezone commence par N', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'N',
          libelle: 'Zone naturelle',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_NATURELLE_N);
      });

      it('devrait retourner ZONE_VOCATION_ACTIVITES si destdomi contient activité', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'UX',
          destdomi: 'Activités économiques',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_VOCATION_ACTIVITES);
      });

      it('devrait ignorer secteurCC et commune si zoneUrba présente', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'U',
        };
        const secteurCC: ResultatSecteurCC = {
          present: true,
          nombreSecteurs: 1,
          typesect: 'constructible',
        };
        const commune: InfoCommune = {
          insee: '75056',
          name: 'Paris',
          is_rnu: true,
        };

        // Act
        const result = calculator.evaluer(zoneUrba, secteurCC, commune);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_URBAINE_U);
      });
    });

    describe('Priorité 2 - Secteur Carte Communale', () => {
      it('devrait retourner SECTEUR_OUVERT_A_LA_CONSTRUCTION si constructible', () => {
        // Arrange
        const secteurCC: ResultatSecteurCC = {
          present: true,
          nombreSecteurs: 1,
          typesect: 'constructible',
        };

        // Act
        const result = calculator.evaluer(null, secteurCC, null);

        // Assert
        expect(result).toBe(
          ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION,
        );
      });

      it('devrait retourner SECTEUR_NON_OUVERT si non constructible', () => {
        // Arrange
        const secteurCC: ResultatSecteurCC = {
          present: true,
          nombreSecteurs: 1,
          typesect: 'non constructible',
        };

        // Act
        const result = calculator.evaluer(null, secteurCC, null);

        // Assert
        expect(result).toBe(
          ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION,
        );
      });

      it('devrait retourner SECTEUR_NON_OUVERT si inconstructible', () => {
        // Arrange
        const secteurCC: ResultatSecteurCC = {
          present: true,
          nombreSecteurs: 1,
          typesect: 'inconstructible',
        };

        // Act
        const result = calculator.evaluer(null, secteurCC, null);

        // Assert
        expect(result).toBe(
          ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION,
        );
      });

      it('devrait ignorer commune si secteurCC présent', () => {
        // Arrange
        const secteurCC: ResultatSecteurCC = {
          present: true,
          nombreSecteurs: 1,
          typesect: 'constructible',
        };
        const commune: InfoCommune = {
          insee: '75056',
          name: 'Paris',
          is_rnu: true,
        };

        // Act
        const result = calculator.evaluer(null, secteurCC, commune);

        // Assert
        expect(result).toBe(
          ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION,
        );
      });
    });

    describe('Priorité 3 - RNU', () => {
      it('devrait retourner NE_SAIT_PAS si commune en RNU', () => {
        // Arrange
        const commune: InfoCommune = {
          insee: '75056',
          name: 'Paris',
          is_rnu: true,
        };

        // Act
        const result = calculator.evaluer(null, null, commune);

        // Assert
        expect(result).toBe(ZonageReglementaire.NE_SAIT_PAS);
      });

      it('devrait retourner NE_SAIT_PAS si commune non RNU sans PLU/CC', () => {
        // Arrange
        const commune: InfoCommune = {
          insee: '75056',
          name: 'Paris',
          is_rnu: false,
        };

        // Act
        const result = calculator.evaluer(null, null, commune);

        // Assert
        expect(result).toBe(ZonageReglementaire.NE_SAIT_PAS);
      });
    });

    describe('Aucune donnée', () => {
      it('devrait retourner NE_SAIT_PAS si tout est null', () => {
        // Act
        const result = calculator.evaluer(null, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.NE_SAIT_PAS);
      });

      it('devrait retourner NE_SAIT_PAS si rien de présent', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: false,
          nombreZones: 0,
        };
        const secteurCC: ResultatSecteurCC = {
          present: false,
          nombreSecteurs: 0,
        };

        // Act
        const result = calculator.evaluer(zoneUrba, secteurCC, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.NE_SAIT_PAS);
      });
    });

    describe('Cas limites', () => {
      it('devrait gérer les typezones en minuscules', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'u',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.ZONE_URBAINE_U);
      });

      it('devrait retourner NE_SAIT_PAS pour typezone inconnu', () => {
        // Arrange
        const zoneUrba: ResultatZoneUrba = {
          present: true,
          nombreZones: 1,
          typezone: 'X',
        };

        // Act
        const result = calculator.evaluer(zoneUrba, null, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.NE_SAIT_PAS);
      });

      it('devrait retourner NE_SAIT_PAS pour typesect inconnu', () => {
        // Arrange
        const secteurCC: ResultatSecteurCC = {
          present: true,
          nombreSecteurs: 1,
          typesect: 'autre',
        };

        // Act
        const result = calculator.evaluer(null, secteurCC, null);

        // Assert
        expect(result).toBe(ZonageReglementaire.NE_SAIT_PAS);
      });
    });
  });
});
