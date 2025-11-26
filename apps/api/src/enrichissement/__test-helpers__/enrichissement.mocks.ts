import { vi, type Mock } from "vitest";

/**
 * Mocks spécifiques au domaine Enrichissement
 */

interface MockEnrichissementService {
  enrichir: Mock;
}

interface MockCadastreEnrichissementService {
  enrichir: Mock;
}

interface MockCadastreService {
  getParcelleInfo: Mock;
}

interface MockBdnbService {
  getSurfaceBatie: Mock;
}

interface MockEnergieEnrichissementService {
  enrichir: Mock;
}

interface MockEnedisService {
  getDistanceRaccordement: Mock;
}

interface MockTransportEnrichissementService {
  enrichir: Mock;
}

interface MockUrbanismeEnrichissementService {
  enrichir: Mock;
}

interface MockRisquesNaturelsEnrichissementService {
  enrichir: Mock;
}

interface MockRisquesNaturelsCalculator {
  combiner: Mock;
  transformRgaToRisque: Mock;
  transformCavitesToRisque: Mock;
}

interface MockRgaService {
  getRga: Mock;
}

interface MockCavitesService {
  getCavites: Mock;
}

interface MockRisquesTechnologiquesEnrichissementService {
  enrichir: Mock;
}

interface MockRisquesTechnologiquesCalculator {
  evaluer: Mock;
}

interface MockSisService {
  getSisByLatLon: Mock;
}

interface MockIcpeService {
  getIcpeByLatLon: Mock;
}

interface MockGeoRisquesEnrichissementService {
  enrichir: Mock;
}

interface MockGeoRisquesOrchestrator {
  fetchAll: Mock;
}

interface MockFiabiliteCalculator {
  calculate: Mock;
}

interface MockEnrichissementRepository {
  save: Mock;
  findById: Mock;
}

interface MockZonageOrchestratorService {
  enrichirZonages: Mock;
}

/**
 * Mock du EnrichissementService (orchestrateur principal)
 */
export function createMockEnrichissementService(): MockEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du CadastreEnrichissementService
 */
export function createMockCadastreEnrichissementService(): MockCadastreEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du CadastreService (adapter)
 */
export function createMockCadastreService(): MockCadastreService {
  return {
    getParcelleInfo: vi.fn(),
  };
}

/**
 * Mock du BdnbService
 */
export function createMockBdnbService(): MockBdnbService {
  return {
    getSurfaceBatie: vi.fn(),
  };
}

/**
 * Mock du EnergieEnrichissementService
 */
export function createMockEnergieEnrichissementService(): MockEnergieEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du EnedisService
 */
export function createMockEnedisService(): MockEnedisService {
  return {
    getDistanceRaccordement: vi.fn(),
  };
}

/**
 * Mock du TransportEnrichissementService
 */
export function createMockTransportEnrichissementService(): MockTransportEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du UrbanismeEnrichissementService
 */
export function createMockUrbanismeEnrichissementService(): MockUrbanismeEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du RisquesNaturelsEnrichissementService
 */
export function createMockRisquesNaturelsEnrichissementService(): MockRisquesNaturelsEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du RisquesNaturelsCalculator
 */
export function createMockRisquesNaturelsCalculator(): MockRisquesNaturelsCalculator {
  return {
    combiner: vi.fn(),
    transformRgaToRisque: vi.fn(),
    transformCavitesToRisque: vi.fn(),
  };
}

/**
 * Mock du RgaService
 */
export function createMockRgaService(): MockRgaService {
  return {
    getRga: vi.fn(),
  };
}

/**
 * Mock du CavitesService
 */
export function createMockCavitesService(): MockCavitesService {
  return {
    getCavites: vi.fn(),
  };
}

/**
 * Mock du RisquesTechnologiquesEnrichissementService
 */
export function createMockRisquesTechnologiquesEnrichissementService(): MockRisquesTechnologiquesEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du RisquesTechnologiquesCalculator
 */
export function createMockRisquesTechnologiquesCalculator(): MockRisquesTechnologiquesCalculator {
  return {
    evaluer: vi.fn(),
  };
}

/**
 * Mock du SisService
 */
export function createMockSisService(): MockSisService {
  return {
    getSisByLatLon: vi.fn(),
  };
}

/**
 * Mock du IcpeService
 */
export function createMockIcpeService(): MockIcpeService {
  return {
    getIcpeByLatLon: vi.fn(),
  };
}

/**
 * Mock du GeoRisquesEnrichissementService
 */
export function createMockGeoRisquesEnrichissementService(): MockGeoRisquesEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du GeoRisquesOrchestrator
 */
export function createMockGeoRisquesOrchestrator(): MockGeoRisquesOrchestrator {
  return {
    fetchAll: vi.fn(),
  };
}

/**
 * Mock du FiabiliteCalculator
 */
export function createMockFiabiliteCalculator(): MockFiabiliteCalculator {
  return {
    calculate: vi.fn(),
  };
}

/**
 * Mock du EnrichissementRepository
 */
export function createMockEnrichissementRepository(): MockEnrichissementRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
  };
}

/**
 * Mock du ZonageOrchestratorService
 */
export function createMockZonageOrchestratorService(): MockZonageOrchestratorService {
  return {
    enrichirZonages: vi.fn(),
  };
}
