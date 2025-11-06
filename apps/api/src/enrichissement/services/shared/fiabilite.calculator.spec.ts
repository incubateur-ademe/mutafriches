import { describe, it, expect, beforeEach } from "vitest";
import { FiabiliteCalculator } from "./fiabilite.calculator";

describe("FiabiliteCalculator", () => {
  let calculator: FiabiliteCalculator;

  beforeEach(() => {
    calculator = new FiabiliteCalculator();
  });

  describe("calculate", () => {
    it("devrait retourner 10/10 avec toutes les sources et aucun champ manquant", () => {
      // Arrange
      const sourcesCount = 5;
      const manquantsCount = 0;

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(10);
    });

    it("devrait penaliser chaque champ manquant de 0.3 point", () => {
      // Arrange
      const sourcesCount = 5;
      const manquantsCount = 3; // -0.9 points

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(9.1); // 10 - 0.9
    });

    it("devrait penaliser si moins de 3 sources (bonus manque)", () => {
      // Arrange
      const sourcesCount = 2; // Moins de 3 sources → -2 points
      const manquantsCount = 0;

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(8); // 10 - 2
    });

    it("devrait ne pas penaliser si plus de 2 sources (bonus present)", () => {
      // Arrange
      const sourcesCount = 3;
      const manquantsCount = 0;

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(10); // Pas de pénalité
    });

    it("devrait combiner les penalites (sources + manquants)", () => {
      // Arrange
      const sourcesCount = 2; // -2 points
      const manquantsCount = 5; // -1.5 points

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(6.5); // 10 - 2 - 1.5
    });

    it("devrait retourner 0 minimum (pas de score negatif)", () => {
      // Arrange
      const sourcesCount = 0; // -2 points
      const manquantsCount = 30; // -9 points

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(0); // Min = 0
    });

    it("devrait retourner 10 maximum (pas de depassement)", () => {
      // Arrange
      const sourcesCount = 10;
      const manquantsCount = 0;

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(10); // Max = 10
    });

    it("devrait arrondir a 1 decimale", () => {
      // Arrange
      const sourcesCount = 5;
      const manquantsCount = 1; // -0.3 → 9.7

      // Act
      const result = calculator.calculate(sourcesCount, manquantsCount);

      // Assert
      expect(result).toBe(9.7);
      expect(result.toString()).not.toContain("9.699999"); // Pas de float bizarre
    });
  });
});
