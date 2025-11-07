import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ZonagePatrimonial } from "@mutafriches/shared-types";
import { ZonagePatrimonialCalculator } from "./zonage-patrimonial.calculator";
import { ResultatAC1, ResultatAC2, ResultatAC4 } from "./zonage-patrimonial.types";

describe("ZonagePatrimonialCalculator", () => {
  let calculator: ZonagePatrimonialCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZonagePatrimonialCalculator],
    }).compile();

    calculator = module.get<ZonagePatrimonialCalculator>(ZonagePatrimonialCalculator);
  });

  describe("evaluer", () => {
    describe("Priorité 1 - AC1 Monuments", () => {
      it("devrait retourner MONUMENT_HISTORIQUE si AC1 type monument", () => {
        // Arrange
        const ac1: ResultatAC1 = {
          present: true,
          nombreZones: 1,
          type: "monument",
        };

        // Act
        const result = calculator.evaluer(ac1, null, null);

        // Assert
        expect(result).toBe(ZonagePatrimonial.MONUMENT_HISTORIQUE);
      });

      it("devrait retourner PERIMETRE_ABF si AC1 type perimetre", () => {
        // Arrange
        const ac1: ResultatAC1 = {
          present: true,
          nombreZones: 1,
          type: "perimetre",
        };

        // Act
        const result = calculator.evaluer(ac1, null, null);

        // Assert
        expect(result).toBe(ZonagePatrimonial.PERIMETRE_ABF);
      });

      it("devrait ignorer AC2 et AC4 si AC1 monument présent", () => {
        // Arrange
        const ac1: ResultatAC1 = {
          present: true,
          nombreZones: 1,
          type: "monument",
        };
        const ac2: ResultatAC2 = { present: true, nombreZones: 1 };
        const ac4: ResultatAC4 = { present: true, nombreZones: 1, type: "spr" };

        // Act
        const result = calculator.evaluer(ac1, ac2, ac4);

        // Assert
        expect(result).toBe(ZonagePatrimonial.MONUMENT_HISTORIQUE);
      });
    });

    describe("Priorité 2 - AC2 Sites", () => {
      it("devrait retourner SITE_INSCRIT_CLASSE si AC2 présent", () => {
        // Arrange
        const ac2: ResultatAC2 = { present: true, nombreZones: 1 };

        // Act
        const result = calculator.evaluer(null, ac2, null);

        // Assert
        expect(result).toBe(ZonagePatrimonial.SITE_INSCRIT_CLASSE);
      });

      it("devrait ignorer AC4 si AC2 présent", () => {
        // Arrange
        const ac2: ResultatAC2 = { present: true, nombreZones: 1 };
        const ac4: ResultatAC4 = { present: true, nombreZones: 1, type: "zppaup" };

        // Act
        const result = calculator.evaluer(null, ac2, ac4);

        // Assert
        expect(result).toBe(ZonagePatrimonial.SITE_INSCRIT_CLASSE);
      });
    });

    describe("Priorité 3 - AC4 SPR/ZPPAUP/AVAP", () => {
      it("devrait retourner ZPPAUP si AC4 type zppaup", () => {
        // Arrange
        const ac4: ResultatAC4 = {
          present: true,
          nombreZones: 1,
          type: "zppaup",
        };

        // Act
        const result = calculator.evaluer(null, null, ac4);

        // Assert
        expect(result).toBe(ZonagePatrimonial.ZPPAUP);
      });

      it("devrait retourner AVAP si AC4 type avap", () => {
        // Arrange
        const ac4: ResultatAC4 = {
          present: true,
          nombreZones: 1,
          type: "avap",
        };

        // Act
        const result = calculator.evaluer(null, null, ac4);

        // Assert
        expect(result).toBe(ZonagePatrimonial.AVAP);
      });

      it("devrait retourner SPR si AC4 type spr", () => {
        // Arrange
        const ac4: ResultatAC4 = {
          present: true,
          nombreZones: 1,
          type: "spr",
        };

        // Act
        const result = calculator.evaluer(null, null, ac4);

        // Assert
        expect(result).toBe(ZonagePatrimonial.SPR);
      });
    });

    describe("Aucun zonage", () => {
      it("devrait retourner NON_CONCERNE si toutes les données sont null", () => {
        // Act
        const result = calculator.evaluer(null, null, null);

        // Assert
        expect(result).toBe(ZonagePatrimonial.NON_CONCERNE);
      });

      it("devrait retourner NON_CONCERNE si aucune zone présente", () => {
        // Arrange
        const ac1: ResultatAC1 = { present: false, nombreZones: 0 };
        const ac2: ResultatAC2 = { present: false, nombreZones: 0 };
        const ac4: ResultatAC4 = { present: false, nombreZones: 0 };

        // Act
        const result = calculator.evaluer(ac1, ac2, ac4);

        // Assert
        expect(result).toBe(ZonagePatrimonial.NON_CONCERNE);
      });
    });
  });

  describe("mapAC1Features", () => {
    it("devrait retourner monument si typeass contient monument", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "Monument historique classé",
            nomass: "Château",
          },
        },
      ];

      // Act
      const result = calculator.mapAC1Features(features as any);

      // Assert
      expect(result).toBe("monument");
    });

    it("devrait retourner perimetre si typeass contient périmètre", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "Périmètre de protection",
            nomass: "Abords du château",
          },
        },
      ];

      // Act
      const result = calculator.mapAC1Features(features as any);

      // Assert
      expect(result).toBe("perimetre");
    });

    it("devrait retourner perimetre par défaut", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "Zone protégée",
            nomass: "Secteur historique",
          },
        },
      ];

      // Act
      const result = calculator.mapAC1Features(features as any);

      // Assert
      expect(result).toBe("perimetre");
    });

    it("devrait retourner null si features vide", () => {
      // Act
      const result = calculator.mapAC1Features([]);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("mapAC4Features", () => {
    it("devrait retourner zppaup si combined contient zppaup", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "ZPPAUP",
            nomass: "Centre historique",
          },
        },
      ];

      // Act
      const result = calculator.mapAC4Features(features as any);

      // Assert
      expect(result).toBe("zppaup");
    });

    it("devrait retourner avap si combined contient avap", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "AVAP",
            nomass: "Quartier ancien",
          },
        },
      ];

      // Act
      const result = calculator.mapAC4Features(features as any);

      // Assert
      expect(result).toBe("avap");
    });

    it("devrait retourner spr si combined contient spr", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "SPR",
            nomass: "Site patrimonial remarquable",
          },
        },
      ];

      // Act
      const result = calculator.mapAC4Features(features as any);

      // Assert
      expect(result).toBe("spr");
    });

    it("devrait retourner spr par défaut", () => {
      // Arrange
      const features = [
        {
          type: "Feature",
          id: "1",
          geometry: {},
          properties: {
            typeass: "Zone patrimoniale",
            nomass: "Secteur sauvegardé",
          },
        },
      ];

      // Act
      const result = calculator.mapAC4Features(features as any);

      // Assert
      expect(result).toBe("spr");
    });

    it("devrait retourner null si features vide", () => {
      // Act
      const result = calculator.mapAC4Features([]);

      // Assert
      expect(result).toBeNull();
    });
  });
});
