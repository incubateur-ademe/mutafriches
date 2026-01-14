import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { SourceUtilisation } from "@mutafriches/shared-types";
import { EvaluationController } from "../src/evaluation/evaluation.controller";
import { OrchestrateurService } from "../src/evaluation/services/orchestrateur.service";
import { OrigineDetectionService } from "../src/shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../src/shared/guards";
import { createThrottledTestApp, describeThrottling } from "./helpers";

// Origine valide pour les tests (Mutafriches prod)
const VALID_ORIGIN = "https://mutafriches.beta.gouv.fr";
// Origine d'un integrateur valide (Benefriches)
const VALID_INTEGRATOR_ORIGIN = "https://benefriches.ademe.fr";

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

function createMocks() {
  return {
    mockOrchestrateurService: {
      calculerMutabilite: vi.fn().mockResolvedValue(mockMutabiliteOutput),
      recupererEvaluation: vi.fn().mockResolvedValue(mockEvaluation),
    },
    mockOrigineDetectionService: {
      detecterOrigine: vi.fn().mockReturnValue({ source: SourceUtilisation.API_DIRECTE }),
    },
  };
}

describe("Evaluation E2E", () => {
  let app: INestApplication;
  let mockOrchestrateurService: ReturnType<typeof createMocks>["mockOrchestrateurService"];
  let mockOrigineDetectionService: ReturnType<typeof createMocks>["mockOrigineDetectionService"];

  beforeAll(async () => {
    const mocks = createMocks();
    mockOrchestrateurService = mocks.mockOrchestrateurService;
    mockOrigineDetectionService = mocks.mockOrigineDetectionService;

    app = await createThrottledTestApp({
      controller: EvaluationController,
      providers: [
        { provide: OrchestrateurService, useValue: mockOrchestrateurService },
        { provide: OrigineDetectionService, useValue: mockOrigineDetectionService },
        IntegrateurOriginGuard,
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /evaluation/calculer", () => {
    it("devrait calculer la mutabilite avec origine valide", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/evaluation/calculer")
        .set("Origin", VALID_ORIGIN)
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ origine: { source: SourceUtilisation.API_DIRECTE } }),
      );
    });

    it("devrait passer le mode detaille via query param", async () => {
      await request(app.getHttpServer() as App)
        .post("/evaluation/calculer?modeDetaille=true")
        .set("Origin", VALID_ORIGIN)
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ modeDetaille: "true" }),
      );
    });

    it("devrait retourner 400 si donneesEnrichies manquantes", async () => {
      await request(app.getHttpServer() as App)
        .post("/evaluation/calculer")
        .set("Origin", VALID_ORIGIN)
        .send({})
        .expect(400);
    });

    it("devrait detecter le mode iframe", async () => {
      mockOrigineDetectionService.detecterOrigine.mockReturnValueOnce({
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur: "cartofriches",
      });

      await request(app.getHttpServer() as App)
        .post("/evaluation/calculer?iframe=true&integrateur=cartofriches")
        .set("Origin", VALID_ORIGIN)
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          origine: { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: "cartofriches" },
        }),
      );
    });

    it("devrait detecter le mode standalone", async () => {
      mockOrigineDetectionService.detecterOrigine.mockReturnValueOnce({
        source: SourceUtilisation.SITE_STANDALONE,
      });

      await request(app.getHttpServer() as App)
        .post("/evaluation/calculer")
        .set("Origin", VALID_ORIGIN)
        .send({
          donneesEnrichies: {
            identifiantCadastral: "49007000AB0123",
          },
        })
        .expect(201);

      expect(mockOrchestrateurService.calculerMutabilite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ origine: { source: SourceUtilisation.SITE_STANDALONE } }),
      );
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

  // Tests de limitation de debit
  describeThrottling({
    getApp: () => app,
    method: "post",
    route: "/evaluation/calculer",
    body: { donneesEnrichies: { identifiantCadastral: "49007000AB0123" } },
    headers: { Origin: VALID_ORIGIN },
  });
});

// Tests de securite dans un describe separe avec nouvelle app par test
describe("Evaluation E2E - Securite Origin", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const mocks = createMocks();

    app = await createThrottledTestApp({
      controller: EvaluationController,
      providers: [
        { provide: OrchestrateurService, useValue: mocks.mockOrchestrateurService },
        { provide: OrigineDetectionService, useValue: mocks.mockOrigineDetectionService },
        IntegrateurOriginGuard,
      ],
    });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it("devrait rejeter une requete sans origine", async () => {
    await request(app.getHttpServer() as App)
      .post("/evaluation/calculer")
      .send({ donneesEnrichies: { identifiantCadastral: "49007000AB0123" } })
      .expect(403);
  });

  it("devrait rejeter une origine non autorisee", async () => {
    await request(app.getHttpServer() as App)
      .post("/evaluation/calculer")
      .set("Origin", "https://malicious-site.com")
      .send({ donneesEnrichies: { identifiantCadastral: "49007000AB0123" } })
      .expect(403);
  });

  it("devrait rejeter localhost en mode non-developpement", async () => {
    await request(app.getHttpServer() as App)
      .post("/evaluation/calculer")
      .set("Origin", "http://localhost:5173")
      .send({ donneesEnrichies: { identifiantCadastral: "49007000AB0123" } })
      .expect(403);
  });

  it("devrait accepter une requete depuis un integrateur autorise", async () => {
    await request(app.getHttpServer() as App)
      .post("/evaluation/calculer")
      .set("Origin", VALID_INTEGRATOR_ORIGIN)
      .send({
        donneesEnrichies: {
          identifiantCadastral: "49007000AB0123",
        },
      })
      .expect(201);
  });
});
