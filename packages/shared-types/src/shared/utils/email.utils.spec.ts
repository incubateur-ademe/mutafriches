import { describe, it, expect } from "vitest";
import { isValidEmail, EMAIL_REGEX } from "./email.utils";

describe("email.utils", () => {
  describe("isValidEmail", () => {
    it("accepte un email valide", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("prenom.nom@sous.domaine.fr")).toBe(true);
    });

    it("rejette un email invalide", () => {
      expect(isValidEmail("pas-un-email")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user @example.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("rejette les valeurs non-string", () => {
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(42)).toBe(false);
    });

    it("rejette un email trop long (> 254 caractères)", () => {
      const tropLong = `${"a".repeat(250)}@example.com`;
      expect(isValidEmail(tropLong)).toBe(false);
    });

    it("expose EMAIL_REGEX", () => {
      expect(EMAIL_REGEX.test("user@example.com")).toBe(true);
    });
  });
});
