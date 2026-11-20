import { vi } from "vitest";
import { IntegrateursRegistreService } from "../integrateurs-registre.service";
import type { IntegrateurRepository } from "../repositories/integrateur.repository";

export interface DepotOriginesFactice {
  listerOriginesActives: ReturnType<typeof vi.fn>;
  estOrigineActive: ReturnType<typeof vi.fn>;
}

// Dépôt réduit aux deux lectures du registre, alimenté par une liste d'origines déclarées.
export function creerDepotOrigines(origines: string[] = []): DepotOriginesFactice {
  return {
    listerOriginesActives: vi.fn().mockResolvedValue(origines),
    estOrigineActive: vi
      .fn()
      .mockImplementation((origine: string) => Promise.resolve(origines.includes(origine))),
  };
}

// Vrai registre (nos origines codées, cache, recherche en base) sur un dépôt factice.
export function creerRegistreDeTest(origines: string[] = []): IntegrateursRegistreService {
  return new IntegrateursRegistreService(
    creerDepotOrigines(origines) as unknown as IntegrateurRepository,
  );
}
