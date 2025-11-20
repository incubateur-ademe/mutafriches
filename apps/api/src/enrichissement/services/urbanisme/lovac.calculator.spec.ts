import { describe, it, expect } from "vitest";
import { LovacCalculator } from "./lovac.calculator";

describe("LovacCalculator", () => {
  describe("calculerTauxVacance", () => {
    it("devrait calculer le taux de vacance correctement", () => {
      // Act & Assert
      expect(LovacCalculator.calculerTauxVacance(6789, 86234)).toBeCloseTo(7.9, 1);
      expect(LovacCalculator.calculerTauxVacance(8456, 171234)).toBeCloseTo(4.9, 1);
      expect(LovacCalculator.calculerTauxVacance(75000, 1000000)).toBe(7.5);
    });

    it("devrait arrondir a 1 decimale", () => {
      // 123 / 1000 = 12.3%
      expect(LovacCalculator.calculerTauxVacance(123, 1000)).toBe(12.3);

      // 125 / 1000 = 12.5%
      expect(LovacCalculator.calculerTauxVacance(125, 1000)).toBe(12.5);

      // 1234 / 10000 = 12.34% → 12.3%
      expect(LovacCalculator.calculerTauxVacance(1234, 10000)).toBe(12.3);

      // 1235 / 10000 = 12.35% → 12.4%
      expect(LovacCalculator.calculerTauxVacance(1235, 10000)).toBe(12.4);
    });

    it("devrait retourner null si nombre de logements vacants est null", () => {
      expect(LovacCalculator.calculerTauxVacance(null, 86234)).toBeNull();
    });

    it("devrait retourner null si nombre total de logements est null", () => {
      expect(LovacCalculator.calculerTauxVacance(6789, null)).toBeNull();
    });

    it("devrait retourner null si les deux sont null", () => {
      expect(LovacCalculator.calculerTauxVacance(null, null)).toBeNull();
    });

    it("devrait retourner null si le nombre total est zero (division par zero)", () => {
      expect(LovacCalculator.calculerTauxVacance(100, 0)).toBeNull();
    });

    it("devrait gerer les cas extremes", () => {
      // 0% de vacance
      expect(LovacCalculator.calculerTauxVacance(0, 1000)).toBe(0);

      // 100% de vacance
      expect(LovacCalculator.calculerTauxVacance(1000, 1000)).toBe(100);

      // Très petit taux
      expect(LovacCalculator.calculerTauxVacance(1, 10000)).toBe(0.0);

      // Très gros nombres
      expect(LovacCalculator.calculerTauxVacance(150000, 2000000)).toBe(7.5);
    });
  });

  describe("sontDonneesExploitables", () => {
    it("devrait retourner true si les donnees sont exploitables", () => {
      expect(LovacCalculator.sontDonneesExploitables(6789, 86234)).toBe(true);
      expect(LovacCalculator.sontDonneesExploitables(0, 1000)).toBe(true);
      expect(LovacCalculator.sontDonneesExploitables(1, 1)).toBe(true);
    });

    it("devrait retourner false si vacants est null", () => {
      expect(LovacCalculator.sontDonneesExploitables(null, 86234)).toBe(false);
    });

    it("devrait retourner false si total est null", () => {
      expect(LovacCalculator.sontDonneesExploitables(6789, null)).toBe(false);
    });

    it("devrait retourner false si les deux sont null", () => {
      expect(LovacCalculator.sontDonneesExploitables(null, null)).toBe(false);
    });

    it("devrait retourner false si le total est zero", () => {
      expect(LovacCalculator.sontDonneesExploitables(100, 0)).toBe(false);
    });
  });

  describe("categoriserTauxVacance", () => {
    it("devrait categoriser comme vacance frictionnelle (< 5%)", () => {
      expect(LovacCalculator.categoriserTauxVacance(0)).toBe("Vacance frictionnelle");
      expect(LovacCalculator.categoriserTauxVacance(2.5)).toBe("Vacance frictionnelle");
      expect(LovacCalculator.categoriserTauxVacance(4.9)).toBe("Vacance frictionnelle");
    });

    it("devrait categoriser comme vacance normale (5-7.5%)", () => {
      expect(LovacCalculator.categoriserTauxVacance(5.0)).toBe("Vacance normale");
      expect(LovacCalculator.categoriserTauxVacance(6.0)).toBe("Vacance normale");
      expect(LovacCalculator.categoriserTauxVacance(7.4)).toBe("Vacance normale");
    });

    it("devrait categoriser comme vacance preoccupante (7.5-10%)", () => {
      expect(LovacCalculator.categoriserTauxVacance(7.5)).toBe("Vacance préoccupante");
      expect(LovacCalculator.categoriserTauxVacance(8.5)).toBe("Vacance préoccupante");
      expect(LovacCalculator.categoriserTauxVacance(9.9)).toBe("Vacance préoccupante");
    });

    it("devrait categoriser comme vacance structurelle (> 10%)", () => {
      expect(LovacCalculator.categoriserTauxVacance(10.0)).toBe("Vacance structurelle");
      expect(LovacCalculator.categoriserTauxVacance(15.0)).toBe("Vacance structurelle");
      expect(LovacCalculator.categoriserTauxVacance(25.0)).toBe("Vacance structurelle");
    });
  });
});
