import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { RisqueNaturel } from "@mutafriches/shared-types";
import { RisquesNaturelsCalculator } from "./risques-naturels.calculator";
import { CavitesResultNormalized } from "../../adapters/georisques/cavites/cavites.types";

describe("RisquesNaturelsCalculator", () => {
  let calculator: RisquesNaturelsCalculator;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RisquesNaturelsCalculator],
    }).compile();

    calculator = module.get<RisquesNaturelsCalculator>(RisquesNaturelsCalculator);
  });

  describe("transformRgaToRisque", () => {
    it("devrait retourner FORT pour alea 'Fort'", () => {
      expect(calculator.transformRgaToRisque("Fort")).toBe(RisqueNaturel.FORT);
    });

    it("devrait retourner FORT pour alea 'fort' (lowercase)", () => {
      expect(calculator.transformRgaToRisque("fort")).toBe(RisqueNaturel.FORT);
    });

    it("devrait retourner FORT pour alea contenant 'fort'", () => {
      expect(calculator.transformRgaToRisque("Alea fort")).toBe(RisqueNaturel.FORT);
    });

    it("devrait retourner MOYEN pour alea 'Moyen'", () => {
      expect(calculator.transformRgaToRisque("Moyen")).toBe(RisqueNaturel.MOYEN);
    });

    it("devrait retourner MOYEN pour alea 'moyen' (lowercase)", () => {
      expect(calculator.transformRgaToRisque("moyen")).toBe(RisqueNaturel.MOYEN);
    });

    it("devrait retourner FAIBLE pour alea 'Faible'", () => {
      expect(calculator.transformRgaToRisque("Faible")).toBe(RisqueNaturel.FAIBLE);
    });

    it("devrait retourner FAIBLE pour alea 'faible' (lowercase)", () => {
      expect(calculator.transformRgaToRisque("faible")).toBe(RisqueNaturel.FAIBLE);
    });

    it("devrait retourner AUCUN pour alea inconnu", () => {
      expect(calculator.transformRgaToRisque("Inexistant")).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait retourner AUCUN pour alea vide", () => {
      expect(calculator.transformRgaToRisque("")).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait gerer les espaces autour", () => {
      expect(calculator.transformRgaToRisque("  Fort  ")).toBe(RisqueNaturel.FORT);
    });
  });

  describe("transformCavitesToRisque", () => {
    it("devrait retourner AUCUN si pas d'exposition", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: false,
        nombreCavites: 0,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait retourner AUCUN si 0 cavite", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 0,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait retourner AUCUN si distance undefined", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 5,
        distancePlusProche: undefined,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait retourner FORT si cavite a moins de 500m", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 499,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.FORT);
    });

    it("devrait retourner FORT si cavite exactement a 500m (limite incluse)", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 500,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.FORT);
    });

    it("devrait retourner MOYEN si cavite entre 500m et 1000m", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 750,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.MOYEN);
    });

    it("devrait retourner MOYEN si cavite exactement a 1000m (limite incluse)", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 1000,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.MOYEN);
    });

    it("devrait retourner FAIBLE si cavite a plus de 1000m", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 1001,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.FAIBLE);
    });

    it("devrait retourner FORT si cavite tres proche (0m)", () => {
      // Arrange
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 0,
      };

      // Act
      const result = calculator.transformCavitesToRisque(data);

      // Assert
      expect(result).toBe(RisqueNaturel.FORT);
    });
  });

  describe("combiner", () => {
    describe("Combinaisons avec FORT", () => {
      it("devrait retourner FORT si FORT + FORT", () => {
        expect(calculator.combiner(RisqueNaturel.FORT, RisqueNaturel.FORT)).toBe(
          RisqueNaturel.FORT,
        );
      });

      it("devrait retourner FORT si FORT + MOYEN", () => {
        expect(calculator.combiner(RisqueNaturel.FORT, RisqueNaturel.MOYEN)).toBe(
          RisqueNaturel.FORT,
        );
        expect(calculator.combiner(RisqueNaturel.MOYEN, RisqueNaturel.FORT)).toBe(
          RisqueNaturel.FORT,
        );
      });

      it("devrait retourner MOYEN si FORT + FAIBLE", () => {
        expect(calculator.combiner(RisqueNaturel.FORT, RisqueNaturel.FAIBLE)).toBe(
          RisqueNaturel.MOYEN,
        );
        expect(calculator.combiner(RisqueNaturel.FAIBLE, RisqueNaturel.FORT)).toBe(
          RisqueNaturel.MOYEN,
        );
      });

      it("devrait retourner MOYEN si FORT + AUCUN", () => {
        expect(calculator.combiner(RisqueNaturel.FORT, RisqueNaturel.AUCUN)).toBe(
          RisqueNaturel.MOYEN,
        );
        expect(calculator.combiner(RisqueNaturel.AUCUN, RisqueNaturel.FORT)).toBe(
          RisqueNaturel.MOYEN,
        );
      });
    });

    describe("Combinaisons avec MOYEN", () => {
      it("devrait retourner MOYEN si MOYEN + MOYEN", () => {
        expect(calculator.combiner(RisqueNaturel.MOYEN, RisqueNaturel.MOYEN)).toBe(
          RisqueNaturel.MOYEN,
        );
      });

      it("devrait retourner MOYEN si MOYEN + FAIBLE", () => {
        expect(calculator.combiner(RisqueNaturel.MOYEN, RisqueNaturel.FAIBLE)).toBe(
          RisqueNaturel.MOYEN,
        );
        expect(calculator.combiner(RisqueNaturel.FAIBLE, RisqueNaturel.MOYEN)).toBe(
          RisqueNaturel.MOYEN,
        );
      });

      it("devrait retourner MOYEN si MOYEN + AUCUN", () => {
        expect(calculator.combiner(RisqueNaturel.MOYEN, RisqueNaturel.AUCUN)).toBe(
          RisqueNaturel.MOYEN,
        );
        expect(calculator.combiner(RisqueNaturel.AUCUN, RisqueNaturel.MOYEN)).toBe(
          RisqueNaturel.MOYEN,
        );
      });
    });

    describe("Combinaisons avec FAIBLE", () => {
      it("devrait retourner FAIBLE si FAIBLE + FAIBLE", () => {
        expect(calculator.combiner(RisqueNaturel.FAIBLE, RisqueNaturel.FAIBLE)).toBe(
          RisqueNaturel.FAIBLE,
        );
      });

      it("devrait retourner FAIBLE si FAIBLE + AUCUN", () => {
        expect(calculator.combiner(RisqueNaturel.FAIBLE, RisqueNaturel.AUCUN)).toBe(
          RisqueNaturel.FAIBLE,
        );
        expect(calculator.combiner(RisqueNaturel.AUCUN, RisqueNaturel.FAIBLE)).toBe(
          RisqueNaturel.FAIBLE,
        );
      });
    });

    describe("Combinaisons avec AUCUN", () => {
      it("devrait retourner AUCUN si AUCUN + AUCUN", () => {
        expect(calculator.combiner(RisqueNaturel.AUCUN, RisqueNaturel.AUCUN)).toBe(
          RisqueNaturel.AUCUN,
        );
      });
    });
  });
});
