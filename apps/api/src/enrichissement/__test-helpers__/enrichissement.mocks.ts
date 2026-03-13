import { vi, type Mock } from "vitest";

/**
 * Mocks spécifiques au domaine Enrichissement
 */

interface MockEnrichissementService {
  enrichir: Mock;
  enrichirSite: Mock;
}

interface MockCadastreEnrichissementService {
  enrichir: Mock;
  enrichirMulti: Mock;
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
  transformRgaToRisque: Mock;
  transformCavitesToRisque: Mock;
  evaluerInondation: Mock;
}

interface MockRgaService {
  getRga: Mock;
}

interface MockCavitesService {
  getCavites: Mock;
}

interface MockTriService {
  getTri: Mock;
}

interface MockAziService {
  getAzi: Mock;
}

interface MockPapiService {
  getPapi: Mock;
}

interface MockPprService {
  getPpr: Mock;
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
  findValidCache: Mock;
}

interface MockZonageOrchestratorService {
  enrichirZonages: Mock;
  enrichirZonagesSite: Mock;
}

interface MockSiteRepository {
  save: Mock;
  findValidCache: Mock;
}

interface MockSiteGeometryService {
  construireSite: Mock;
}

interface MockAdemeSitesPolluesRepository {
  isSiteReferencePollue: Mock;
  findSitePlusProche: Mock;
  count: Mock;
}

interface MockEnrEnrichissementService {
  enrichir: Mock;
}

interface MockEnrCalculator {
  evaluer: Mock;
}

interface MockPollutionDetectionService {
  enrichir: Mock;
}

/**
 * Mock du EnrichissementService (orchestrateur principal)
 */
export function createMockEnrichissementService(): MockEnrichissementService {
  return {
    enrichir: vi.fn(),
    enrichirSite: vi.fn(),
  };
}

/**
 * Mock du CadastreEnrichissementService
 */
export function createMockCadastreEnrichissementService(): MockCadastreEnrichissementService {
  return {
    enrichir: vi.fn(),
    enrichirMulti: vi.fn(),
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
    transformRgaToRisque: vi.fn(),
    transformCavitesToRisque: vi.fn(),
    evaluerInondation: vi.fn(),
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
 * Mock du TriService
 */
export function createMockTriService(): MockTriService {
  return {
    getTri: vi.fn(),
  };
}

/**
 * Mock du AziService
 */
export function createMockAziService(): MockAziService {
  return {
    getAzi: vi.fn(),
  };
}

/**
 * Mock du PapiService
 */
export function createMockPapiService(): MockPapiService {
  return {
    getPapi: vi.fn(),
  };
}

/**
 * Mock du PprService
 */
export function createMockPprService(): MockPprService {
  return {
    getPpr: vi.fn(),
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
    findValidCache: vi.fn(),
  };
}

/**
 * Mock du ZonageOrchestratorService
 */
export function createMockZonageOrchestratorService(): MockZonageOrchestratorService {
  return {
    enrichirZonages: vi.fn(),
    enrichirZonagesSite: vi.fn(),
  };
}

/**
 * Mock du AdemeSitesPolluesRepository
 */
export function createMockAdemeSitesPolluesRepository(): MockAdemeSitesPolluesRepository {
  return {
    isSiteReferencePollue: vi.fn(),
    findSitePlusProche: vi.fn(),
    count: vi.fn(),
  };
}

/**
 * Mock du EnrEnrichissementService
 */
export function createMockEnrEnrichissementService(): MockEnrEnrichissementService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du EnrCalculator
 */
export function createMockEnrCalculator(): MockEnrCalculator {
  return {
    evaluer: vi.fn().mockReturnValue("non"),
  };
}

/**
 * Mock du PollutionDetectionService
 */
export function createMockPollutionDetectionService(): MockPollutionDetectionService {
  return {
    enrichir: vi.fn(),
  };
}

/**
 * Mock du SiteRepository
 */
export function createMockSiteRepository(): MockSiteRepository {
  return {
    save: vi.fn(),
    findValidCache: vi.fn(),
  };
}

/**
 * Mock du SiteGeometryService
 */
export function createMockSiteGeometryService(): MockSiteGeometryService {
  return {
    construireSite: vi.fn(),
  };
}
