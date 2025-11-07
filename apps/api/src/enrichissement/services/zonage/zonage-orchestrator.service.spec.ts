import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZonageReglementaire,
  SourceEnrichissement,
} from '@mutafriches/shared-types';
import { ZonageOrchestratorService } from './zonage-orchestrator.service';
import { ZonageEnvironnementalService } from './zonage-environnemental/zonage-environnemental.service';
import { ZonagePatrimonialService } from './zonage-patrimonial/zonage-patrimonial.service';
import { ZonageReglementaireService } from './zonage-reglementaire/zonage-reglementaire.service';
import { ParcelleGeometry } from '../shared/geometry.types';

describe('ZonageOrchestratorService', () => {
  let orchestrator: ZonageOrchestratorService;
  let zonageEnvironnementalService: any;
  let zonagePatrimonialService: any;
  let zonageReglementaireService: any;

  const mockGeometry: ParcelleGeometry = {
    type: 'Point',
    coordinates: [2.3522, 48.8566],
  };

  const mockCodeInsee = '75056';

  beforeEach(async () => {
    zonageEnvironnementalService = {
      enrichir: vi.fn(),
    };

    zonagePatrimonialService = {
      enrichir: vi.fn(),
    };

    zonageReglementaireService = {
      enrichir: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonageOrchestratorService,
        {
          provide: ZonageEnvironnementalService,
          useValue: zonageEnvironnementalService,
        },
        {
          provide: ZonagePatrimonialService,
          useValue: zonagePatrimonialService,
        },
        {
          provide: ZonageReglementaireService,
          useValue: zonageReglementaireService,
        },
      ],
    }).compile();

    orchestrator = module.get<ZonageOrchestratorService>(
      ZonageOrchestratorService,
    );
  });

  describe('enrichirZonages', () => {
    it('devrait enrichir avec tous les zonages détectés', async () => {
      // Arrange
      zonageEnvironnementalService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_NATURE],
          sourcesEchouees: [],
        },
        evaluation: {
          natura2000: { present: true, nombreZones: 1 },
          znieff: { present: false, type1: false, type2: false, nombreZones: 0 },
          parcNaturel: { present: false, type: null },
          reserveNaturelle: { present: false, nombreReserves: 0 },
          zonageFinal: ZonageEnvironnemental.NATURA_2000,
        },
      });

      zonagePatrimonialService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          ac1: { present: true, nombreZones: 1, type: 'monument' },
          ac2: { present: false, nombreZones: 0 },
          ac4: { present: false, nombreZones: 0 },
          zonageFinal: ZonagePatrimonial.MONUMENT_HISTORIQUE,
        },
      });

      zonageReglementaireService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          zoneUrba: {
            present: true,
            nombreZones: 1,
            typezone: 'U',
            libelle: 'Zone urbaine',
          },
          secteurCC: { present: false, nombreSecteurs: 0 },
          commune: { insee: '75056', name: 'Paris', is_rnu: false },
          zonageFinal: ZonageReglementaire.ZONE_URBAINE_U,
        },
      });

      // Act
      const result = await orchestrator.enrichirZonages(
        mockGeometry,
        mockCodeInsee,
      );

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(
        SourceEnrichissement.API_CARTO_NATURE,
      );
      expect(result.result.sourcesUtilisees).toContain(
        SourceEnrichissement.API_CARTO_GPU,
      );
      expect(result.zonageEnvironnemental).toBe(ZonageEnvironnemental.NATURA_2000);
      expect(result.zonagePatrimonial).toBe(
        ZonagePatrimonial.MONUMENT_HISTORIQUE,
      );
      expect(result.zonageReglementaire).toBe(ZonageReglementaire.ZONE_URBAINE_U);
      expect(result.evaluations.environnemental).toBeTruthy();
      expect(result.evaluations.patrimonial).toBeTruthy();
      expect(result.evaluations.reglementaire).toBeTruthy();
    });

    it('devrait gérer les zonages HORS_ZONE / NON_CONCERNE / NE_SAIT_PAS', async () => {
      // Arrange
      zonageEnvironnementalService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_NATURE],
          sourcesEchouees: [],
        },
        evaluation: {
          natura2000: { present: false, nombreZones: 0 },
          znieff: { present: false, type1: false, type2: false, nombreZones: 0 },
          parcNaturel: { present: false, type: null },
          reserveNaturelle: { present: false, nombreReserves: 0 },
          zonageFinal: ZonageEnvironnemental.HORS_ZONE,
        },
      });

      zonagePatrimonialService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          ac1: { present: false, nombreZones: 0 },
          ac2: { present: false, nombreZones: 0 },
          ac4: { present: false, nombreZones: 0 },
          zonageFinal: ZonagePatrimonial.NON_CONCERNE,
        },
      });

      zonageReglementaireService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          zoneUrba: { present: false, nombreZones: 0 },
          secteurCC: { present: false, nombreSecteurs: 0 },
          commune: { insee: '12345', name: 'Village', is_rnu: true },
          zonageFinal: ZonageReglementaire.NE_SAIT_PAS,
        },
      });

      // Act
      const result = await orchestrator.enrichirZonages(
        mockGeometry,
        mockCodeInsee,
      );

      // Assert
      expect(result.zonageEnvironnemental).toBe(ZonageEnvironnemental.HORS_ZONE);
      expect(result.zonagePatrimonial).toBe(ZonagePatrimonial.NON_CONCERNE);
      expect(result.zonageReglementaire).toBe(ZonageReglementaire.NE_SAIT_PAS);
    });

    it('devrait continuer si un service échoue', async () => {
      // Arrange
      zonageEnvironnementalService.enrichir.mockRejectedValue(
        new Error('Service indisponible'),
      );

      zonagePatrimonialService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          ac1: { present: false, nombreZones: 0 },
          ac2: { present: false, nombreZones: 0 },
          ac4: { present: false, nombreZones: 0 },
          zonageFinal: ZonagePatrimonial.NON_CONCERNE,
        },
      });

      zonageReglementaireService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          zoneUrba: {
            present: true,
            nombreZones: 1,
            typezone: 'A',
            libelle: 'Zone agricole',
          },
          secteurCC: { present: false, nombreSecteurs: 0 },
          commune: { insee: '12345', name: 'Commune', is_rnu: false },
          zonageFinal: ZonageReglementaire.ZONE_AGRICOLE_A,
        },
      });

      // Act
      const result = await orchestrator.enrichirZonages(
        mockGeometry,
        mockCodeInsee,
      );

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesEchouees).toContain(
        SourceEnrichissement.API_CARTO_NATURE,
      );
      expect(result.zonageEnvironnemental).toBeNull();
      expect(result.zonagePatrimonial).toBe(ZonagePatrimonial.NON_CONCERNE);
      expect(result.zonageReglementaire).toBe(ZonageReglementaire.ZONE_AGRICOLE_A);
      expect(result.evaluations.environnemental).toBeNull();
      expect(result.evaluations.patrimonial).toBeTruthy();
    });

    it('devrait consolider les sources utilisées sans doublons', async () => {
      // Arrange - Les 3 services utilisent API_CARTO_GPU
      zonageEnvironnementalService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_NATURE],
          sourcesEchouees: [],
        },
        evaluation: {
          zonageFinal: ZonageEnvironnemental.HORS_ZONE,
        },
      });

      zonagePatrimonialService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          zonageFinal: ZonagePatrimonial.NON_CONCERNE,
        },
      });

      zonageReglementaireService.enrichir.mockResolvedValue({
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.API_CARTO_GPU],
          sourcesEchouees: [],
        },
        evaluation: {
          zonageFinal: ZonageReglementaire.ZONE_URBAINE_U,
        },
      });

      // Act
      const result = await orchestrator.enrichirZonages(
        mockGeometry,
        mockCodeInsee,
      );

      // Assert
      expect(result.result.sourcesUtilisees).toHaveLength(2);
      expect(result.result.sourcesUtilisees).toContain(
        SourceEnrichissement.API_CARTO_NATURE,
      );
      expect(result.result.sourcesUtilisees).toContain(
        SourceEnrichissement.API_CARTO_GPU,
      );
    });

    it('devrait appeler les 3 services en parallèle', async () => {
      // Arrange
      const startTimes: Record<string, number> = {};

      zonageEnvironnementalService.enrichir.mockImplementation(async () => {
        startTimes.environnemental = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          result: { success: true, sourcesUtilisees: [], sourcesEchouees: [] },
          evaluation: { zonageFinal: ZonageEnvironnemental.HORS_ZONE },
        };
      });

      zonagePatrimonialService.enrichir.mockImplementation(async () => {
        startTimes.patrimonial = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          result: { success: true, sourcesUtilisees: [], sourcesEchouees: [] },
          evaluation: { zonageFinal: ZonagePatrimonial.NON_CONCERNE },
        };
      });

      zonageReglementaireService.enrichir.mockImplementation(async () => {
        startTimes.reglementaire = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          result: { success: true, sourcesUtilisees: [], sourcesEchouees: [] },
          evaluation: { zonageFinal: ZonageReglementaire.NE_SAIT_PAS },
        };
      });

      // Act
      await orchestrator.enrichirZonages(mockGeometry, mockCodeInsee);

      // Assert
      const times = Object.values(startTimes);
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(10);
    });

    it('devrait retourner success false si tous les services échouent', async () => {
      // Arrange
      zonageEnvironnementalService.enrichir.mockRejectedValue(
        new Error('Erreur 1'),
      );
      zonagePatrimonialService.enrichir.mockRejectedValue(new Error('Erreur 2'));
      zonageReglementaireService.enrichir.mockRejectedValue(
        new Error('Erreur 3'),
      );

      // Act
      const result = await orchestrator.enrichirZonages(
        mockGeometry,
        mockCodeInsee,
      );

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesUtilisees).toHaveLength(0);
      expect(result.result.sourcesEchouees.length).toBeGreaterThan(0);
    });
  });
});
