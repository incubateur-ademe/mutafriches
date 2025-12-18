import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { FrichesController } from "../src/friches/friches.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";
import { OrchestrateurService } from "../src/evaluation/services/orchestrateur.service";
import { createThrottledTestApp, describeThrottling } from "./helpers";

describe("Friches (Proxy Deprecated) E2E", () => {
  let app: INestApplication;
  let mockEnrichissementService: {
    enrichir: ReturnType<typeof vi.fn>;
  };
  let mockOrchestrateurService: {
    calculerMutabilite: ReturnType<typeof vi.fn>;
    recupererEvaluation: ReturnType<typeof vi.fn>;
  };

  const mockEnrichissementOutput = {
    identifiantCadastral: "49007000AB0123",
    parcelle: { surface: 1500 },
  };

  const mockMutabiliteOutput = {
    id: "eval-test-123",
    identifiantCadastral: "49007000AB0123",
    indices: {},
  };

  const mockEvaluation = {
    id: "eval-test-123",
    parcelleId: "49007000AB0123",
    dateCalcul: new Date().toISOString(),
    versionAlgorithme: "1.1.0",
    donneesEnrichissement: {},
    donneesComplementaires: {},
    resultats: {},
  };

  beforeAll(async () => {
    mockEnrichissementService = {
      enrichir: vi.fn().mockResolvedValue(mockEnrichissementOutput),
    };

    mockOrchestrateurService = {
      calculerMutabilite: vi.fn().mockResolvedValue(mockMutabiliteOutput),
      recupererEvaluation: vi.fn().mockResolvedValue(mockEvaluation),
    };

    app = await createThrottledTestApp({
      controller: FrichesController,
      providers: [
        { provide: EnrichissementService, useValue: mockEnrichissementService },
        { provide: OrchestrateurService, useValue: mockOrchestrateurService },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /friches/enrichir (deprecated)", () => {
    it("devrait enrichir une parcelle via le proxy", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/friches/enrichir")
        .send({ identifiant: "49007000AB0123" })
        .expect(201);

      expect(response.body).toHaveProperty("identifiantCadastral");
      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith("49007000AB0123");
    });
  });

  describe("POST /friches/calculer (deprecated)", () => {
    it("devrait calculer la mutabilite via le proxy", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/friches/calculer")
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalled();
    });
  });

  describe("GET /friches/evaluations/:id (deprecated)", () => {
    it("devrait recuperer une evaluation via le proxy", async () => {
      const response = await request(app.getHttpServer() as App)
        .get("/friches/evaluations/eval-test-123")
        .expect(200);

      expect(response.body).toHaveProperty("id", "eval-test-123");
    });

    it("devrait retourner 404 si evaluation non trouvee", async () => {
      mockOrchestrateurService.recupererEvaluation.mockResolvedValueOnce(null);

      await request(app.getHttpServer() as App)
        .get("/friches/evaluations/eval-inexistant")
        .expect(404);
    });
  });

  describe("GET /friches/metadata (deprecated)", () => {
    it("devrait retourner les metadonnees via le proxy", async () => {
      const response = await request(app.getHttpServer() as App)
        .get("/friches/metadata")
        .expect(200);

      expect(response.body).toHaveProperty("enums");
      expect(response.body).toHaveProperty("version");
    });
  });

  // Tests de limitation de débit
  describeThrottling({
    getApp: () => app,
    method: "post",
    route: "/friches/enrichir",
    body: { identifiant: "49007000AB0123" },
  });
});
