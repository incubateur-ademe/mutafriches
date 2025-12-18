import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { EnrichissementController } from "../src/enrichissement/enrichissement.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";
import { createThrottledTestApp, describeThrottling } from "./helpers";

describe("Enrichissement E2E", () => {
  let app: INestApplication;
  let mockEnrichissementService: {
    enrichir: ReturnType<typeof vi.fn>;
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

    app = await createThrottledTestApp({
      controller: EnrichissementController,
      providers: [{ provide: EnrichissementService, useValue: mockEnrichissementService }],
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
      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith("49007000AB0123");
    });

    it("devrait appeler le service avec l'identifiant fourni", async () => {
      await request(app.getHttpServer() as App)
        .post("/enrichissement")
        .send({ identifiant: "75056000AA0001" })
        .expect(201);

      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith("75056000AA0001");
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
