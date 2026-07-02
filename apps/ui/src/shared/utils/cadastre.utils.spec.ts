import { describe, expect, it } from "vitest";
import { extraireCodeInsee, extraireDepartement } from "./cadastre.utils";

describe("extraireCodeInsee", () => {
  it("extrait le code INSEE métropole (5 caractères)", () => {
    expect(extraireCodeInsee("49353000AC0628")).toBe("49353");
  });

  it("extrait le code INSEE corse", () => {
    expect(extraireCodeInsee("2a0040000B0045")).toBe("2A004");
  });

  it("retourne une chaîne vide pour un identifiant invalide", () => {
    expect(extraireCodeInsee(undefined)).toBe("");
    expect(extraireCodeInsee("4")).toBe("");
  });
});

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
