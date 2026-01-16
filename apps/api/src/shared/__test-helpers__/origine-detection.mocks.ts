import { vi, type Mock } from "vitest";
import { SourceUtilisation } from "@mutafriches/shared-types";

interface MockOrigineDetectionService {
  detecterOrigine: Mock;
}

/**
 * Mock du OrigineDetectionService
 * Service de detection de l'origine des appels API
 */
export function createMockOrigineDetectionService(): MockOrigineDetectionService {
  return {
    detecterOrigine: vi.fn().mockReturnValue({
      source: SourceUtilisation.API_DIRECTE,
    }),
  };
}
