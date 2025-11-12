import { describe, it, expect } from "vitest";
import { resolveCodeInseeArrondissement, ARRONDISSEMENTS_MAP } from "./arrondissement.utils";

describe("arrondissement.utils", () => {
  describe("resolveCodeInseeArrondissement", () => {
    describe("Paris", () => {
      it("should resolve Paris 1er arrondissement", () => {
        const result = resolveCodeInseeArrondissement("75101");
        expect(result.resolved).toBe("75056");
        expect(result.wasTransformed).toBe(true);
        expect(result.ville).toBe("Paris");
      });

      it("should resolve Paris 20ème arrondissement", () => {
        const result = resolveCodeInseeArrondissement("75120");
        expect(result.resolved).toBe("75056");
        expect(result.wasTransformed).toBe(true);
        expect(result.ville).toBe("Paris");
      });

      it("should not transform non-arrondissement Paris code", () => {
        const result = resolveCodeInseeArrondissement("75056");
        expect(result.resolved).toBe("75056");
        expect(result.wasTransformed).toBe(false);
      });
    });

    describe("Marseille", () => {
      it("should resolve Marseille 1er arrondissement", () => {
        const result = resolveCodeInseeArrondissement("13201");
        expect(result.resolved).toBe("13055");
        expect(result.wasTransformed).toBe(true);
        expect(result.ville).toBe("Marseille");
      });

      it("should resolve Marseille 16ème arrondissement", () => {
        const result = resolveCodeInseeArrondissement("13216");
        expect(result.resolved).toBe("13055");
        expect(result.wasTransformed).toBe(true);
        expect(result.ville).toBe("Marseille");
      });

      it("should not transform non-arrondissement Marseille code", () => {
        const result = resolveCodeInseeArrondissement("13055");
        expect(result.resolved).toBe("13055");
        expect(result.wasTransformed).toBe(false);
      });
    });

    describe("Lyon", () => {
      it("should resolve Lyon 1er arrondissement", () => {
        const result = resolveCodeInseeArrondissement("69381");
        expect(result.resolved).toBe("69123");
        expect(result.wasTransformed).toBe(true);
        expect(result.ville).toBe("Lyon");
      });

      it("should resolve Lyon 9ème arrondissement", () => {
        const result = resolveCodeInseeArrondissement("69389");
        expect(result.resolved).toBe("69123");
        expect(result.wasTransformed).toBe(true);
        expect(result.ville).toBe("Lyon");
      });

      it("should not transform non-arrondissement Lyon code", () => {
        const result = resolveCodeInseeArrondissement("69123");
        expect(result.resolved).toBe("69123");
        expect(result.wasTransformed).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should not transform other cities", () => {
        const result = resolveCodeInseeArrondissement("33063"); // Bordeaux
        expect(result.resolved).toBe("33063");
        expect(result.wasTransformed).toBe(false);
      });

      it("should handle empty string", () => {
        const result = resolveCodeInseeArrondissement("");
        expect(result.resolved).toBe("");
        expect(result.wasTransformed).toBe(false);
      });

      it("should handle short codes", () => {
        const result = resolveCodeInseeArrondissement("751");
        expect(result.resolved).toBe("751");
        expect(result.wasTransformed).toBe(false);
      });
    });
  });

  describe("ARRONDISSEMENTS_MAP", () => {
    it("should contain Paris configuration", () => {
      expect(ARRONDISSEMENTS_MAP["751"]).toBeDefined();
      expect(ARRONDISSEMENTS_MAP["751"].codeCommune).toBe("75056");
      expect(ARRONDISSEMENTS_MAP["751"].range).toEqual([101, 120]);
    });

    it("should contain Marseille configuration", () => {
      expect(ARRONDISSEMENTS_MAP["132"]).toBeDefined();
      expect(ARRONDISSEMENTS_MAP["132"].codeCommune).toBe("13055");
      expect(ARRONDISSEMENTS_MAP["132"].range).toEqual([201, 216]);
    });

    it("should contain Lyon configuration", () => {
      expect(ARRONDISSEMENTS_MAP["693"]).toBeDefined();
      expect(ARRONDISSEMENTS_MAP["693"].codeCommune).toBe("69123");
      expect(ARRONDISSEMENTS_MAP["693"].range).toEqual([381, 389]);
    });
  });
});
