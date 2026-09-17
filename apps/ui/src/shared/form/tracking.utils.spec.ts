import { describe, it, expect } from "vitest";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { identifiantCadastralTracking } from "./tracking.utils";

describe("identifiantCadastralTracking", () => {
  it("retourne la parcelle prédominante quand l'enrichissement l'a fournie", () => {
    const enrichment = { parcellePredominante: "49020000AK0119" } as EnrichissementOutputDto;

    expect(identifiantCadastralTracking(enrichment, "49020000AK0118,49020000AK0119")).toBe(
      "49020000AK0119",
    );
  });

  it("retombe sur la première parcelle en multi sans prédominante", () => {
    expect(identifiantCadastralTracking(undefined, "49020000AK0118,49020000AK0119")).toBe(
      "49020000AK0118",
    );
  });

  it("ne tronque pas un identifiant mono-parcelle", () => {
    expect(identifiantCadastralTracking(undefined, "49020000AK0118")).toBe("49020000AK0118");
  });

  it("retourne undefined sans identifiant", () => {
    expect(identifiantCadastralTracking(undefined, undefined)).toBeUndefined();
    expect(identifiantCadastralTracking(undefined, "")).toBeUndefined();
  });

  it("ne renvoie jamais de valeur rejetée par le DTO (20 car., alphanumérique majuscule)", () => {
    const resultat = identifiantCadastralTracking(
      undefined,
      "49020000AK0118,49020000AK0119,49020000AK0120",
    );

    expect(resultat).toMatch(/^[0-9A-Z]{1,20}$/);
  });
});
