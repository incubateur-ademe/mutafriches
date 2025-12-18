import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { EvaluationController } from "../src/evaluation/evaluation.controller";
import { OrchestrateurService } from "../src/evaluation/services/orchestrateur.service";

describe("Evaluation E2E", () => {
  let app: INestApplication;
  let mockOrchestrateurService: {
    calculerMutabilite: ReturnType<typeof vi.fn>;
    recupererEvaluation: ReturnType<typeof vi.fn>;
  };

  const mockMutabiliteOutput = {
    id: "eval-test-123",
    identifiantCadastral: "49007000AB0123",
    dateCalcul: new Date().toISOString(),
    indices: {
      logementCollectif: { score: 75, fiabilite: 0.8 },
      logementIndividuel: { score: 65, fiabilite: 0.75 },
      activiteEconomique: { score: 70, fiabilite: 0.82 },
      equipementPublic: { score: 60, fiabilite: 0.7 },
      espaceVert: { score: 85, fiabilite: 0.9 },
      agricole: { score: 40, fiabilite: 0.6 },
      renaturalisation: { score: 80, fiabilite: 0.85 },
    },
    usageRecommande: "espaceVert",
  };

  const mockEvaluation = {
    id: "eval-test-123",
    parcelleId: "49007000AB0123",
    dateCalcul: new Date().toISOString(),
    versionAlgorithme: "1.1.0",
    donneesEnrichissement: {},
    donneesComplementaires: {},
    resultats: mockMutabiliteOutput.indices,
  };

  beforeAll(async () => {
    mockOrchestrateurService = {
      calculerMutabilite: vi.fn().mockResolvedValue(mockMutabiliteOutput),
      recupererEvaluation: vi.fn().mockResolvedValue(mockEvaluation),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 5, // Limite basse pour les tests
          },
        ]),
      ],
      controllers: [EvaluationController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: OrchestrateurService,
          useValue: mockOrchestrateurService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /evaluation/calculer", () => {
    it("devrait calculer la mutabilite", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/evaluation/calculer")
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalled();
    });

    it("devrait passer le mode detaille via query param", async () => {
      await request(app.getHttpServer() as App)
        .post("/evaluation/calculer?modeDetaille=true")
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      // Note: les query params arrivent en string dans NestJS sans ParseBoolPipe
      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ modeDetaille: "true" }),
      );
    });

    it("devrait retourner 400 si donneesEnrichies manquantes", async () => {
      await request(app.getHttpServer() as App)
        .post("/evaluation/calculer")
        .send({})
        .expect(400);
    });
  });

  describe("GET /evaluation/:id", () => {
    it("devrait recuperer une evaluation existante", async () => {
      const response = await request(app.getHttpServer() as App)
        .get("/evaluation/eval-test-123")
        .expect(200);

      expect(response.body).toHaveProperty("id", "eval-test-123");
    });

    it("devrait retourner 404 si evaluation non trouvee", async () => {
      mockOrchestrateurService.recupererEvaluation.mockResolvedValueOnce(null);

      await request(app.getHttpServer() as App)
        .get("/evaluation/eval-inexistant")
        .expect(404);
    });
  });

  describe("GET /evaluation/metadata", () => {
    it("devrait retourner les metadonnees", async () => {
      const response = await request(app.getHttpServer() as App)
        .get("/evaluation/metadata")
        .expect(200);

      expect(response.body).toHaveProperty("enums");
      expect(response.body).toHaveProperty("version");
    });
  });

  describe("Rate Limiter", () => {
    it("devrait retourner 429 quand la limite est depassee sur POST /calculer", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App)
          .post("/evaluation/calculer")
          .send({
            donneesEnrichies: {
              identifiantCadastral: "49007000AB0123",
            },
          }),
      );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);

      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    it("devrait retourner 429 quand la limite est depassee sur GET /:id", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App).get("/evaluation/eval-test-123"),
      );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);

      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    it("devrait retourner le message Too Many Requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App).get("/evaluation/metadata"),
      );

      const responses = await Promise.all(requests);
      const blockedResponse = responses.find((r) => r.status === 429);

      if (blockedResponse) {
        expect(blockedResponse.body.message).toContain("Too Many Requests");
      }
    });
  });
});
