import { describe, it, expect } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { MAX_PARCELLES_PAR_SITE_API } from "@mutafriches/shared-types";
import { EnrichirSiteSwaggerDto } from "./enrichir-site.dto";

function identifiants(nombre: number): string[] {
  return Array.from({ length: nombre }, (_, i) => `70310000AS${String(i).padStart(4, "0")}`);
}

describe("EnrichirSiteSwaggerDto", () => {
  it("devrait accepter un site de 60 parcelles", async () => {
    const dto = plainToInstance(EnrichirSiteSwaggerDto, { identifiants: identifiants(60) });

    expect(await validate(dto)).toHaveLength(0);
  });

  it("devrait refuser un site de 61 parcelles en nommant la limite", async () => {
    const dto = plainToInstance(EnrichirSiteSwaggerDto, { identifiants: identifiants(61) });

    const erreurs = await validate(dto);

    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].constraints?.arrayMaxSize).toBe("Maximum 60 parcelles par site");
  });

  // evaluations.site_id (varchar 1000) stocke les identifiants joints par virgules.
  it("devrait tenir dans la colonne site_id à la limite", () => {
    expect(identifiants(MAX_PARCELLES_PAR_SITE_API).join(",").length).toBeLessThanOrEqual(1000);
  });
});
