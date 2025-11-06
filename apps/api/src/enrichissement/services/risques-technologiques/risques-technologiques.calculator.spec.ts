import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { RisquesTechnologiquesCalculator } from "./risques-technologiques.calculator";

describe("RisquesTechnologiquesCalculator", () => {
  let calculator: RisquesTechnologiquesCalculator;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RisquesTechnologiquesCalculator],
    }).compile();

    calculator = module.get<RisquesTechnologiquesCalculator>(RisquesTechnologiquesCalculator);
  });

  describe("evaluer", () => {
    describe("Présence SIS", () => {
      it("devrait retourner true si presence SIS (peu importe ICPE)", () => {
        // Arrange
        const presenceSis = true;
        const distanceIcpe = 1000; // Loin

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });

      it("devrait retourner true si presence SIS meme sans ICPE", () => {
        // Arrange
        const presenceSis = true;
        const distanceIcpe = undefined; // Aucune ICPE

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("Proximité ICPE", () => {
      it("devrait retourner true si ICPE a moins de 500m (seuil)", () => {
        // Arrange
        const presenceSis = false;
        const distanceIcpe = 499; // < 500m

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });

      it("devrait retourner true si ICPE exactement a 500m (limite incluse)", () => {
        // Arrange
        const presenceSis = false;
        const distanceIcpe = 500; // = 500m

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });

      it("devrait retourner false si ICPE a plus de 500m", () => {
        // Arrange
        const presenceSis = false;
        const distanceIcpe = 501; // > 500m

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(false);
      });

      it("devrait retourner true si ICPE tres proche (0m)", () => {
        // Arrange
        const presenceSis = false;
        const distanceIcpe = 0; // Sur le site

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("Aucun risque", () => {
      it("devrait retourner false si pas de SIS et pas d'ICPE", () => {
        // Arrange
        const presenceSis = false;
        const distanceIcpe = undefined; // Aucune ICPE

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(false);
      });

      it("devrait retourner false si pas de SIS et ICPE loin", () => {
        // Arrange
        const presenceSis = false;
        const distanceIcpe = 2000; // Loin

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe("Combinaisons", () => {
      it("devrait retourner true si SIS ET ICPE proche (double risque)", () => {
        // Arrange
        const presenceSis = true;
        const distanceIcpe = 200;

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });

      it("devrait retourner true si SIS ET ICPE loin (SIS suffit)", () => {
        // Arrange
        const presenceSis = true;
        const distanceIcpe = 1500;

        // Act
        const result = calculator.evaluer(presenceSis, distanceIcpe);

        // Assert
        expect(result).toBe(true);
      });
    });
  });

  describe("getSeuilDistanceIcpe", () => {
    it("devrait retourner 500 (constante du seuil)", () => {
      // Act
      const seuil = calculator.getSeuilDistanceIcpe();

      // Assert
      expect(seuil).toBe(500);
    });
  });
});
