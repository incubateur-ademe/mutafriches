import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { RisqueNaturel, SourceEnrichissement } from "@mutafriches/shared-types";
import { RisquesNaturelsEnrichissementService } from "./risques-naturels-enrichissement.service";
import { RisquesNaturelsCalculator } from "./risques-naturels.calculator";
import { RgaService } from "../../adapters/georisques/rga/rga.service";
import { CavitesService } from "../../adapters/georisques/cavites/cavites.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("RisquesNaturelsEnrichissementService", () => {
  let service: RisquesNaturelsEnrichissementService;
  let rgaService: { getRga: ReturnType<typeof vi.fn> };
  let cavitesService: { getCavites: ReturnType<typeof vi.fn> };
  let calculator: {
    combiner: ReturnType<typeof vi.fn>;
    transformRgaToRisque: ReturnType<typeof vi.fn>;
    transformCavitesToRisque: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const mockRgaService = {
      getRga: vi.fn(),
    };

    const mockCavitesService = {
      getCavites: vi.fn(),
    };

    const mockCalculator = {
      combiner: vi.fn(),
      transformRgaToRisque: vi.fn(),
      transformCavitesToRisque: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RisquesNaturelsEnrichissementService,
        { provide: RgaService, useValue: mockRgaService },
        { provide: CavitesService, useValue: mockCavitesService },
        { provide: RisquesNaturelsCalculator, useValue: mockCalculator },
      ],
    }).compile();

    service = module.get<RisquesNaturelsEnrichissementService>(
      RisquesNaturelsEnrichissementService,
    );
    rgaService = module.get(RgaService);
    cavitesService = module.get(CavitesService);
    calculator = module.get(RisquesNaturelsCalculator);
  });

  describe("enrichir", () => {
    it("devrait combiner RGA et Cavites avec le calculator", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      rgaService.getRga.mockResolvedValue({
        success: true,
        data: { alea: "Fort" },
      });

      cavitesService.getCavites.mockResolvedValue({
        success: true,
        data: {
          exposition: true,
          nombreCavites: 2,
          distancePlusProche: 300,
        },
      });

      calculator.transformRgaToRisque.mockReturnValue(RisqueNaturel.FORT);
      calculator.transformCavitesToRisque.mockReturnValue(RisqueNaturel.FORT);
      calculator.combiner.mockReturnValue(RisqueNaturel.FORT);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(calculator.transformRgaToRisque).toHaveBeenCalledWith("Fort");
      expect(calculator.transformCavitesToRisque).toHaveBeenCalledWith({
        exposition: true,
        nombreCavites: 2,
        distancePlusProche: 300,
      });
      expect(calculator.combiner).toHaveBeenCalledWith(RisqueNaturel.FORT, RisqueNaturel.FORT);
      expect(parcelle.presenceRisquesNaturels).toBe(RisqueNaturel.FORT);
    });

    it("devrait enrichir meme si RGA echoue (avec Cavites seul)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      rgaService.getRga.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      cavitesService.getCavites.mockResolvedValue({
        success: true,
        data: {
          exposition: true,
          nombreCavites: 1,
          distancePlusProche: 400,
        },
      });

      calculator.transformCavitesToRisque.mockReturnValue(RisqueNaturel.FORT);
      calculator.combiner.mockReturnValue(RisqueNaturel.MOYEN); // AUCUN + FORT = MOYEN

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(calculator.combiner).toHaveBeenCalledWith(RisqueNaturel.AUCUN, RisqueNaturel.FORT);
      expect(parcelle.presenceRisquesNaturels).toBe(RisqueNaturel.MOYEN);
    });

    it("devrait enrichir meme si Cavites echoue (avec RGA seul)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      rgaService.getRga.mockResolvedValue({
        success: true,
        data: { alea: "Moyen" },
      });

      cavitesService.getCavites.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      calculator.transformRgaToRisque.mockReturnValue(RisqueNaturel.MOYEN);
      calculator.combiner.mockReturnValue(RisqueNaturel.MOYEN); // MOYEN + AUCUN = MOYEN

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(calculator.combiner).toHaveBeenCalledWith(RisqueNaturel.MOYEN, RisqueNaturel.AUCUN);
      expect(parcelle.presenceRisquesNaturels).toBe(RisqueNaturel.MOYEN);
    });

    it("devrait retourner AUCUN si les deux services echouent", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      rgaService.getRga.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      cavitesService.getCavites.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      calculator.combiner.mockReturnValue(RisqueNaturel.AUCUN);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesEchouees).toHaveLength(2);
      expect(calculator.combiner).toHaveBeenCalledWith(RisqueNaturel.AUCUN, RisqueNaturel.AUCUN);
      expect(parcelle.presenceRisquesNaturels).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait retourner echec si pas de coordonnees", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = undefined;

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_RGA);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_CAVITES);
      expect(result.evaluation.risqueFinal).toBe(RisqueNaturel.AUCUN);
    });

    it("devrait appeler les services en parallele", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      let rgaCallTime = 0;
      let cavitesCallTime = 0;

      rgaService.getRga.mockImplementation(async () => {
        rgaCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { alea: "Fort" } };
      });

      cavitesService.getCavites.mockImplementation(async () => {
        cavitesCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { exposition: true, nombreCavites: 1 } };
      });

      calculator.transformRgaToRisque.mockReturnValue(RisqueNaturel.FORT);
      calculator.transformCavitesToRisque.mockReturnValue(RisqueNaturel.AUCUN);
      calculator.combiner.mockReturnValue(RisqueNaturel.MOYEN);

      // Act
      await service.enrichir(parcelle);

      // Assert - Les deux appels doivent avoir été lancés presque en même temps
      const timeDiff = Math.abs(rgaCallTime - cavitesCallTime);
      expect(timeDiff).toBeLessThan(5); // Moins de 5ms de différence
    });
  });
});
