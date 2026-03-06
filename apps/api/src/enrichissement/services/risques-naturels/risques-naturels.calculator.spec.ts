import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";
import { RisquesNaturelsCalculator } from "./risques-naturels.calculator";
import { CavitesResultNormalized } from "../../adapters/georisques/cavites/cavites.types";

describe("RisquesNaturelsCalculator", () => {
  let calculator: RisquesNaturelsCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RisquesNaturelsCalculator],
    }).compile();

    calculator = module.get<RisquesNaturelsCalculator>(RisquesNaturelsCalculator);
  });

  describe("transformRgaToRisque", () => {
    it("devrait retourner FORT pour alea 'Fort'", () => {
      expect(calculator.transformRgaToRisque("Fort")).toBe(RisqueRetraitGonflementArgile.FORT);
    });

    it("devrait retourner FORT pour alea 'fort' (lowercase)", () => {
      expect(calculator.transformRgaToRisque("fort")).toBe(RisqueRetraitGonflementArgile.FORT);
    });

    it("devrait retourner FORT pour alea contenant 'fort'", () => {
      expect(calculator.transformRgaToRisque("Alea fort")).toBe(RisqueRetraitGonflementArgile.FORT);
    });

    it("devrait retourner FAIBLE_OU_MOYEN pour alea 'Moyen'", () => {
      expect(calculator.transformRgaToRisque("Moyen")).toBe(
        RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
      );
    });

    it("devrait retourner FAIBLE_OU_MOYEN pour alea 'moyen' (lowercase)", () => {
      expect(calculator.transformRgaToRisque("moyen")).toBe(
        RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
      );
    });

    it("devrait retourner FAIBLE_OU_MOYEN pour alea 'Faible'", () => {
      expect(calculator.transformRgaToRisque("Faible")).toBe(
        RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
      );
    });

    it("devrait retourner FAIBLE_OU_MOYEN pour alea 'faible' (lowercase)", () => {
      expect(calculator.transformRgaToRisque("faible")).toBe(
        RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
      );
    });

    it("devrait retourner AUCUN pour alea inconnu", () => {
      expect(calculator.transformRgaToRisque("Inexistant")).toBe(
        RisqueRetraitGonflementArgile.AUCUN,
      );
    });

    it("devrait retourner AUCUN pour alea vide", () => {
      expect(calculator.transformRgaToRisque("")).toBe(RisqueRetraitGonflementArgile.AUCUN);
    });

    it("devrait gerer les espaces autour", () => {
      expect(calculator.transformRgaToRisque("  Fort  ")).toBe(RisqueRetraitGonflementArgile.FORT);
    });
  });

  describe("transformCavitesToRisque", () => {
    it("devrait retourner NON si pas d'exposition", () => {
      const data: CavitesResultNormalized = {
        exposition: false,
        nombreCavites: 0,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.NON);
    });

    it("devrait retourner NON si 0 cavite", () => {
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 0,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.NON);
    });

    it("devrait retourner NON si distance undefined", () => {
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 5,
        distancePlusProche: undefined,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.NON);
    });

    it("devrait retourner OUI si cavite a moins de 500m", () => {
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 499,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.OUI);
    });

    it("devrait retourner OUI si cavite exactement a 500m (limite incluse)", () => {
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 500,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.OUI);
    });

    it("devrait retourner NON si cavite a plus de 500m", () => {
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 501,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.NON);
    });

    it("devrait retourner OUI si cavite tres proche (0m)", () => {
      const data: CavitesResultNormalized = {
        exposition: true,
        nombreCavites: 1,
        distancePlusProche: 0,
      };
      expect(calculator.transformCavitesToRisque(data)).toBe(RisqueCavitesSouterraines.OUI);
    });
  });

  describe("evaluerInondation", () => {
    it("devrait retourner NON si aucun risque", () => {
      expect(calculator.evaluerInondation(false, false, false, false)).toBe(RisqueInondation.NON);
    });

    it("devrait retourner OUI si TRI present", () => {
      expect(calculator.evaluerInondation(true, false, false, false)).toBe(RisqueInondation.OUI);
    });

    it("devrait retourner OUI si AZI present", () => {
      expect(calculator.evaluerInondation(false, true, false, false)).toBe(RisqueInondation.OUI);
    });

    it("devrait retourner OUI si PAPI present", () => {
      expect(calculator.evaluerInondation(false, false, true, false)).toBe(RisqueInondation.OUI);
    });

    it("devrait retourner OUI si PPR present", () => {
      expect(calculator.evaluerInondation(false, false, false, true)).toBe(RisqueInondation.OUI);
    });

    it("devrait retourner OUI si tous presents", () => {
      expect(calculator.evaluerInondation(true, true, true, true)).toBe(RisqueInondation.OUI);
    });
  });
});
