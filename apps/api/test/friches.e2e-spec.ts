import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { FrichesController } from "../src/friches/friches.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";
import { OrchestrateurService } from "../src/evaluation/services/orchestrateur.service";
import { IntegrateurOriginGuard } from "../src/shared/guards";
import { createThrottledTestApp, describeThrottling } from "./helpers";

// Origine valide pour les tests (Mutafriches prod)
const VALID_ORIGIN = "https://mutafriches.beta.gouv.fr";

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

function createMocks() {
  return {
    mockEnrichissementService: {
      enrichir: vi.fn().mockResolvedValue(mockEnrichissementOutput),
    },
    mockOrchestrateurService: {
      calculerMutabilite: vi.fn().mockResolvedValue(mockMutabiliteOutput),
      recupererEvaluation: vi.fn().mockResolvedValue(mockEvaluation),
    },
  };
}

describe("Friches (Proxy Deprecated) E2E", () => {
  let app: INestApplication;
  let mockEnrichissementService: ReturnType<typeof createMocks>["mockEnrichissementService"];
  let mockOrchestrateurService: ReturnType<typeof createMocks>["mockOrchestrateurService"];

  beforeAll(async () => {
    const mocks = createMocks();
    mockEnrichissementService = mocks.mockEnrichissementService;
    mockOrchestrateurService = mocks.mockOrchestrateurService;

    app = await createThrottledTestApp({
      controller: FrichesController,
      providers: [
        { provide: EnrichissementService, useValue: mockEnrichissementService },
        { provide: OrchestrateurService, useValue: mockOrchestrateurService },
        IntegrateurOriginGuard,
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /friches/enrichir (deprecated)", () => {
    it("devrait enrichir une parcelle via le proxy avec origine valide", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/friches/enrichir")
        .set("Origin", VALID_ORIGIN)
        .send({ identifiant: "49007000AB0123" })
        .expect(201);

      expect(response.body).toHaveProperty("identifiantCadastral");
      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith("49007000AB0123");
    });
  });

  describe("POST /friches/calculer (deprecated)", () => {
    it("devrait calculer la mutabilite via le proxy avec origine valide", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/friches/calculer")
        .set("Origin", VALID_ORIGIN)
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

  // Tests de limitation de debit
  describeThrottling({
    getApp: () => app,
    method: "post",
    route: "/friches/enrichir",
    body: { identifiant: "49007000AB0123" },
    headers: { Origin: VALID_ORIGIN },
  });
});

// Tests de securite dans un describe separe avec nouvelle app par test
describe("Friches E2E - Securite Origin", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const mocks = createMocks();

    app = await createThrottledTestApp({
      controller: FrichesController,
      providers: [
        { provide: EnrichissementService, useValue: mocks.mockEnrichissementService },
        { provide: OrchestrateurService, useValue: mocks.mockOrchestrateurService },
        IntegrateurOriginGuard,
      ],
    });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it("devrait rejeter POST /friches/enrichir sans origine", async () => {
    await request(app.getHttpServer() as App)
      .post("/friches/enrichir")
      .send({ identifiant: "49007000AB0123" })
      .expect(403);
  });

  it("devrait rejeter POST /friches/calculer sans origine", async () => {
    await request(app.getHttpServer() as App)
      .post("/friches/calculer")
      .send({ donneesEnrichies: { identifiantCadastral: "49007000AB0123" } })
      .expect(403);
  });

  it("devrait rejeter une origine non autorisee sur /friches/enrichir", async () => {
    await request(app.getHttpServer() as App)
      .post("/friches/enrichir")
      .set("Origin", "https://malicious-site.com")
      .send({ identifiant: "49007000AB0123" })
      .expect(403);
  });

  it("devrait rejeter une origine non autorisee sur /friches/calculer", async () => {
    await request(app.getHttpServer() as App)
      .post("/friches/calculer")
      .set("Origin", "https://malicious-site.com")
      .send({ donneesEnrichies: { identifiantCadastral: "49007000AB0123" } })
      .expect(403);
  });
});
