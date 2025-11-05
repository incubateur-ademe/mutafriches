import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { RisquesTechnologiquesEnrichissementService } from "./risques-technologiques-enrichissement.service";
import { RisquesTechnologiquesCalculator } from "./risques-technologiques.calculator";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";

describe("RisquesTechnologiquesEnrichissementService", () => {
  let service: RisquesTechnologiquesEnrichissementService;
  let sisService: { getSisByLatLon: ReturnType<typeof vi.fn> };
  let icpeService: { getIcpeByLatLon: ReturnType<typeof vi.fn> };
  let calculator: { evaluer: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const mockSisService = {
      getSisByLatLon: vi.fn(),
    };

    const mockIcpeService = {
      getIcpeByLatLon: vi.fn(),
    };

    const mockCalculator = {
      evaluer: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RisquesTechnologiquesEnrichissementService,
        { provide: SisService, useValue: mockSisService },
        { provide: IcpeService, useValue: mockIcpeService },
        { provide: RisquesTechnologiquesCalculator, useValue: mockCalculator },
      ],
    }).compile();

    service = module.get<RisquesTechnologiquesEnrichissementService>(
      RisquesTechnologiquesEnrichissementService,
    );
    sisService = module.get(SisService);
    icpeService = module.get(IcpeService);
    calculator = module.get(RisquesTechnologiquesCalculator);
  });

  describe("enrichir", () => {
    it("devrait evaluer avec SIS et ICPE", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: true },
      });

      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 2, distancePlusProche: 300 },
      });

      calculator.evaluer.mockReturnValue(true);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(calculator.evaluer).toHaveBeenCalledWith(true, 300);
      expect(parcelle.presenceRisquesTechnologiques).toBe(true);
      expect(result.result.success).toBe(true);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
    });

    it("devrait evaluer meme si SIS echoue (avec ICPE seul)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      sisService.getSisByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 1, distancePlusProche: 200 },
      });

      calculator.evaluer.mockReturnValue(true);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(calculator.evaluer).toHaveBeenCalledWith(false, 200);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(parcelle.presenceRisquesTechnologiques).toBe(true);
    });

    it("devrait evaluer meme si ICPE echoue (avec SIS seul)", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: true },
      });

      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      calculator.evaluer.mockReturnValue(true);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(calculator.evaluer).toHaveBeenCalledWith(true, undefined);
      expect(result.result.sourcesUtilisees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
      expect(parcelle.presenceRisquesTechnologiques).toBe(true);
    });

    it("devrait retourner false si les deux services echouent", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      sisService.getSisByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: false,
        error: "Service indisponible",
      });

      calculator.evaluer.mockReturnValue(false);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.sourcesEchouees).toHaveLength(2);
      expect(calculator.evaluer).toHaveBeenCalledWith(false, undefined);
      expect(parcelle.presenceRisquesTechnologiques).toBe(false);
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
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_SIS);
      expect(result.result.sourcesEchouees).toContain(SourceEnrichissement.GEORISQUES_ICPE);
      expect(result.evaluation.risqueFinal).toBe(false);
    });

    it("devrait appeler les services en parallele", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      let sisCallTime = 0;
      let icpeCallTime = 0;

      sisService.getSisByLatLon.mockImplementation(async () => {
        sisCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { presenceSis: true } };
      });

      icpeService.getIcpeByLatLon.mockImplementation(async () => {
        icpeCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, data: { nombreIcpe: 1, distancePlusProche: 300 } };
      });

      calculator.evaluer.mockReturnValue(true);

      // Act
      await service.enrichir(parcelle);

      // Assert - Les deux appels doivent avoir été lancés presque en même temps
      const timeDiff = Math.abs(sisCallTime - icpeCallTime);
      expect(timeDiff).toBeLessThan(5); // Moins de 5ms de différence
    });

    it("devrait enrichir sans distance ICPE si aucune installation", async () => {
      // Arrange
      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = "29232000AB0123";
      parcelle.coordonnees = { latitude: 48.0, longitude: -4.0 };

      sisService.getSisByLatLon.mockResolvedValue({
        success: true,
        data: { presenceSis: false },
      });

      icpeService.getIcpeByLatLon.mockResolvedValue({
        success: true,
        data: { nombreIcpe: 0, distancePlusProche: undefined },
      });

      calculator.evaluer.mockReturnValue(false);

      // Act
      const result = await service.enrichir(parcelle);

      // Assert
      expect(calculator.evaluer).toHaveBeenCalledWith(false, undefined);
      expect(parcelle.presenceRisquesTechnologiques).toBe(false);
    });
  });
});
