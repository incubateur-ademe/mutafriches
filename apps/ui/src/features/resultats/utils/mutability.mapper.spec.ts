import { describe, it, expect } from "vitest";
import { EtatBatiInfrastructure, ValeurArchitecturale } from "@mutafriches/shared-types";
import { buildDonneesComplementaires } from "./mutability.mapper";

describe("buildDonneesComplementaires", () => {
  it("complète le champ masqué par « Pas de bâti »", () => {
    const dto = buildDonneesComplementaires({
      etatBatiInfrastructure: EtatBatiInfrastructure.PAS_DE_BATI,
    });

    expect(dto.valeurArchitecturaleHistorique).toBe(ValeurArchitecturale.PAS_DE_BATI);
  });

  it("garde « Ne sait pas » par défaut hors « Pas de bâti »", () => {
    const dto = buildDonneesComplementaires({
      etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    });

    expect(dto.valeurArchitecturaleHistorique).toBe(ValeurArchitecturale.NE_SAIT_PAS);
  });
});
