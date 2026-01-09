import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { SourceUtilisation } from "@mutafriches/shared-types";
import { EnrichissementController } from "../src/enrichissement/enrichissement.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";
import { OrigineDetectionService } from "../src/shared/services/origine-detection.service";
import { createThrottledTestApp, describeThrottling } from "./helpers";

describe("Enrichissement E2E", () => {
  let app: INestApplication;
  let mockEnrichissementService: {
    enrichir: ReturnType<typeof vi.fn>;
  };
  let mockOrigineDetectionService: {
    detecterOrigine: ReturnType<typeof vi.fn>;
  };

  const mockEnrichissementOutput = {
    identifiantCadastral: "49007000AB0123",
    parcelle: {
      surface: 1500,
      commune: "Angers",
      codeInsee: "49007",
    },
    energie: {
      raccordementElectrique: true,
    },
    transport: {
      arretsProximite: [],
    },
    risques: {
      naturels: [],
      technologiques: [],
    },
    zonages: {
      environnementaux: [],
      patrimoniaux: [],
      reglementaires: [],
    },
  };

  beforeAll(async () => {
    mockEnrichissementService = {
      enrichir: vi.fn().mockResolvedValue(mockEnrichissementOutput),
    };
    mockOrigineDetectionService = {
      detecterOrigine: vi.fn().mockReturnValue({ source: SourceUtilisation.API_DIRECTE }),
    };

    app = await createThrottledTestApp({
      controller: EnrichissementController,
      providers: [
        { provide: EnrichissementService, useValue: mockEnrichissementService },
        { provide: OrigineDetectionService, useValue: mockOrigineDetectionService },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /enrichissement", () => {
    it("devrait enrichir une parcelle", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/enrichissement")
        .send({ identifiant: "49007000AB0123" })
        .expect(201);

      expect(response.body).toHaveProperty("identifiantCadastral", "49007000AB0123");
      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith(
        "49007000AB0123",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
    });

    it("devrait appeler le service avec l'identifiant fourni", async () => {
      await request(app.getHttpServer() as App)
        .post("/enrichissement")
        .send({ identifiant: "75056000AA0001" })
        .expect(201);

      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith(
        "75056000AA0001",
        SourceUtilisation.API_DIRECTE,
        undefined,
      );
    });

    it("devrait detecter le mode iframe", async () => {
      mockOrigineDetectionService.detecterOrigine.mockReturnValueOnce({
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur: "cartofriches",
      });

      await request(app.getHttpServer() as App)
        .post("/enrichissement?iframe=true&integrateur=cartofriches")
        .send({ identifiant: "49007000AB0123" })
        .expect(201);

      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith(
        "49007000AB0123",
        SourceUtilisation.IFRAME_INTEGREE,
        "cartofriches",
      );
    });

    it("devrait detecter le mode standalone", async () => {
      mockOrigineDetectionService.detecterOrigine.mockReturnValueOnce({
        source: SourceUtilisation.SITE_STANDALONE,
      });

      await request(app.getHttpServer() as App)
        .post("/enrichissement")
        .send({ identifiant: "49007000AB0123" })
        .expect(201);

      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith(
        "49007000AB0123",
        SourceUtilisation.SITE_STANDALONE,
        undefined,
      );
    });
  });

  // Tests de limitation de débit
  describeThrottling({
    getApp: () => app,
    method: "post",
    route: "/enrichissement",
    body: { identifiant: "49007000AB0123" },
  });
});
