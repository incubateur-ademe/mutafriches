import { vi } from "vitest";

/**
 * Mocks spécifiques au domaine Enrichissement
 */

/**
 * Mock du EnrichissementService (orchestrateur principal)
 */
export function createMockEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du CadastreEnrichissementService
 */
export function createMockCadastreEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du CadastreService (adapter)
 */
export function createMockCadastreService() {
  return {
    getParcelleInfo: vi.fn(),
  };
}

/**
 * Mock du BdnbService
 */
export function createMockBdnbService() {
  return {
    getSurfaceBatie: vi.fn(),
  };
}

/**
 * Mock du EnergieEnrichissementService
 */
export function createMockEnergieEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du EnedisService
 */
export function createMockEnedisService() {
  return {
    getDistanceRaccordement: vi.fn(),
  };
}

/**
 * Mock du TransportEnrichissementService
 */
export function createMockTransportEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du UrbanismeEnrichissementService
 */
export function createMockUrbanismeEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du RisquesNaturelsEnrichissementService
 */
export function createMockRisquesNaturelsEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du RisquesNaturelsCalculator
 */
export function createMockRisquesNaturelsCalculator() {
  return {
    combiner: vi.fn(),
    transformRgaToRisque: vi.fn(),
    transformCavitesToRisque: vi.fn(),
  };
}

/**
 * Mock du RgaService
 */
export function createMockRgaService() {
  return {
    getRga: vi.fn(),
  };
}

/**
 * Mock du CavitesService
 */
export function createMockCavitesService() {
  return {
    getCavites: vi.fn(),
  };
}

/**
 * Mock du RisquesTechnologiquesEnrichissementService
 */
export function createMockRisquesTechnologiquesEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du RisquesTechnologiquesCalculator
 */
export function createMockRisquesTechnologiquesCalculator() {
  return {
    evaluer: vi.fn(),
  };
}

/**
 * Mock du SisService
 */
export function createMockSisService() {
  return {
    getSisByLatLon: vi.fn(),
  };
}

/**
 * Mock du IcpeService
 */
export function createMockIcpeService() {
  return {
    getIcpeByLatLon: vi.fn(),
  };
}

/**
 * Mock du GeoRisquesEnrichissementService
 */
export function createMockGeoRisquesEnrichissementService() {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du GeoRisquesOrchestrator
 */
export function createMockGeoRisquesOrchestrator() {
  return {
    fetchAll: vi.fn(),
  };
}

/**
 * Mock du FiabiliteCalculator
 */
export function createMockFiabiliteCalculator() {
  return {
    calculate: vi.fn(),
  };
}

/**
 * Mock du EnrichissementRepository
 */
export function createMockEnrichissementRepository() {
  return {
    save: vi.fn(),
    findById: vi.fn(),
  };
}

/**
 * Mock du ZonageOrchestratorService
 */
export function createMockZonageOrchestratorService() {
  return {
    enrichirZonages: vi.fn(),
  };
}
