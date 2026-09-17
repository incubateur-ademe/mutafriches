import { describe, expect, it } from "vitest";
import {
  isValidCommuneName,
  sanitizeCodeDepartement,
  sanitizeCodeInsee,
  sanitizeCommuneName,
} from "./commune.utils";

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

describe("sanitizeCodeInsee", () => {
  it("accepte un code métropolitain et un code d'outre-mer", () => {
    expect(sanitizeCodeInsee("45051")).toBe("45051");
    expect(sanitizeCodeInsee("97101")).toBe("97101");
  });

  it("accepte un code corse", () => {
    expect(sanitizeCodeInsee("2A004")).toBe("2A004");
    expect(sanitizeCodeInsee("2B033")).toBe("2B033");
  });

  it("refuse une longueur ou un alphabet invalides", () => {
    expect(sanitizeCodeInsee("4505")).toBeNull();
    expect(sanitizeCodeInsee("450511")).toBeNull();
    expect(sanitizeCodeInsee("2C004")).toBeNull();
    expect(sanitizeCodeInsee(undefined)).toBeNull();
  });

  // La valeur part en paramètre d'URL et dans des fichiers générés.
  it("refuse une tentative d'injection", () => {
    expect(sanitizeCodeInsee("45051&evil=1")).toBeNull();
    expect(sanitizeCodeInsee("../../etc")).toBeNull();
  });
});

describe("sanitizeCodeDepartement", () => {
  it("accepte métropole, outre-mer et Corse", () => {
    expect(sanitizeCodeDepartement("45")).toBe("45");
    expect(sanitizeCodeDepartement("971")).toBe("971");
    expect(sanitizeCodeDepartement("2A")).toBe("2A");
  });

  it("refuse une valeur hors format", () => {
    expect(sanitizeCodeDepartement("4")).toBeNull();
    expect(sanitizeCodeDepartement("4501")).toBeNull();
    expect(sanitizeCodeDepartement("")).toBeNull();
  });
});
