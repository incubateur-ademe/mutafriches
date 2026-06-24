import { describe, expect, it } from "vitest";
import { extraireDepartement } from "./cadastre.utils";

describe("extraireDepartement", () => {
  it("extrait un département métropolitain (2 chiffres)", () => {
    expect(extraireDepartement("490070000A0123")).toBe("49");
  });

  it("extrait un département corse (2A / 2B)", () => {
    expect(extraireDepartement("2A0040000B0045")).toBe("2A");
    expect(extraireDepartement("2b0040000B0045")).toBe("2B");
  });

  it("extrait un département DOM (3 chiffres)", () => {
    expect(extraireDepartement("9740120000C001")).toBe("974");
  });

  it("renvoie une chaîne vide si l'identifiant est absent ou trop court", () => {
    expect(extraireDepartement(undefined)).toBe("");
    expect(extraireDepartement("")).toBe("");
    expect(extraireDepartement("4")).toBe("");
  });
});
