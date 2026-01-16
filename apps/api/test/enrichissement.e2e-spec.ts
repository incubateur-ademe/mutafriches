import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { SourceUtilisation } from "@mutafriches/shared-types";
import { EnrichissementController } from "../src/enrichissement/enrichissement.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";
import { OrigineDetectionService } from "../src/shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../src/shared/guards";
import { createThrottledTestApp, describeThrottling } from "./helpers";

// Origine valide pour les tests (Mutafriches prod)
const VALID_ORIGIN = "https://mutafriches.beta.gouv.fr";
// Origine d'un integrateur valide (Benefriches)
const VALID_INTEGRATOR_ORIGIN = "https://benefriches.ademe.fr";

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

function createMocks() {
  return {
    mockEnrichissementService: {
      enrichir: vi.fn().mockResolvedValue(mockEnrichissementOutput),
    },
    mockOrigineDetectionService: {
      detecterOrigine: vi.fn().mockReturnValue({ source: SourceUtilisation.API_DIRECTE }),
    },
  };
}

describe("Enrichissement E2E", () => {
  let app: INestApplication;
  let mockEnrichissementService: ReturnType<typeof createMocks>["mockEnrichissementService"];
  let mockOrigineDetectionService: ReturnType<typeof createMocks>["mockOrigineDetectionService"];

  beforeAll(async () => {
    const mocks = createMocks();
    mockEnrichissementService = mocks.mockEnrichissementService;
    mockOrigineDetectionService = mocks.mockOrigineDetectionService;

    app = await createThrottledTestApp({
      controller: EnrichissementController,
      providers: [
        { provide: EnrichissementService, useValue: mockEnrichissementService },
        { provide: OrigineDetectionService, useValue: mockOrigineDetectionService },
        IntegrateurOriginGuard,
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /enrichissement", () => {
    it("devrait enrichir une parcelle avec origine valide", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/enrichissement")
        .set("Origin", VALID_ORIGIN)
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
        .set("Origin", VALID_ORIGIN)
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
        .set("Origin", VALID_ORIGIN)
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
        .set("Origin", VALID_ORIGIN)
        .send({ identifiant: "49007000AB0123" })
        .expect(201);

      expect(mockEnrichissementService.enrichir).toHaveBeenCalledWith(
        "49007000AB0123",
        SourceUtilisation.SITE_STANDALONE,
        undefined,
      );
    });

    it("devrait accepter une requete depuis un integrateur autorise", async () => {
      await request(app.getHttpServer() as App)
        .post("/enrichissement")
        .set("Origin", VALID_INTEGRATOR_ORIGIN)
        .send({ identifiant: "49007000AB0123" })
        .expect(201);
    });
  });

  // Tests de limitation de debit
  describeThrottling({
    getApp: () => app,
    method: "post",
    route: "/enrichissement",
    body: { identifiant: "49007000AB0123" },
    headers: { Origin: VALID_ORIGIN },
  });
});

// Tests de securite dans un describe separe avec nouvelle app par test
// pour eviter que le throttler bloque les tests
describe("Enrichissement E2E - Securite Origin", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const mocks = createMocks();

    app = await createThrottledTestApp({
      controller: EnrichissementController,
      providers: [
        { provide: EnrichissementService, useValue: mocks.mockEnrichissementService },
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
      .post("/enrichissement")
      .send({ identifiant: "49007000AB0123" })
      .expect(403);
  });

  it("devrait rejeter une origine non autorisee", async () => {
    await request(app.getHttpServer() as App)
      .post("/enrichissement")
      .set("Origin", "https://malicious-site.com")
      .send({ identifiant: "49007000AB0123" })
      .expect(403);
  });

  it("devrait rejeter localhost en mode non-developpement", async () => {
    await request(app.getHttpServer() as App)
      .post("/enrichissement")
      .set("Origin", "http://localhost:5173")
      .send({ identifiant: "49007000AB0123" })
      .expect(403);
  });
});
