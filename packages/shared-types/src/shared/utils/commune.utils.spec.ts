import { describe, expect, it } from "vitest";
import { isValidCommuneName, sanitizeCommuneName } from "./commune.utils";

describe("isValidCommuneName", () => {
  it("accepte les noms accentués avec tiret, apostrophe et parenthèses", () => {
    expect(isValidCommuneName("Cannes-Écluse")).toBe(true);
    expect(isValidCommuneName("L'Isle-d'Abeau")).toBe(true);
    expect(isValidCommuneName("Bar-le-Duc (2)")).toBe(true);
  });

  it("rejette les caractères de code (guillemets, retour ligne)", () => {
    expect(isValidCommuneName('Foo";evil()')).toBe(false);
    expect(isValidCommuneName("Foo\nBar")).toBe(false);
  });
});

describe("sanitizeCommuneName", () => {
  it("retourne le nom si valide", () => {
    expect(sanitizeCommuneName("Montereau-Fault-Yonne")).toBe("Montereau-Fault-Yonne");
  });

  it("retourne null pour une valeur absente ou vide", () => {
    expect(sanitizeCommuneName(undefined)).toBeNull();
    expect(sanitizeCommuneName(null)).toBeNull();
    expect(sanitizeCommuneName("")).toBeNull();
  });

  it("retourne null pour une tentative d'injection", () => {
    expect(sanitizeCommuneName('Foo";maliciousCode();//')).toBeNull();
    expect(sanitizeCommuneName("Foo\nevil")).toBeNull();
  });
});
