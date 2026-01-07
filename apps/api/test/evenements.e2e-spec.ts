import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { EvenementsController } from "../src/evenements/evenements.controller";
import { EvenementService } from "../src/evenements/services/evenement.service";
import { TypeEvenement } from "@mutafriches/shared-types";
import { createThrottledTestApp, describeThrottling } from "./helpers";

describe("Evenements E2E", () => {
  let app: INestApplication;
  let mockEvenementService: {
    enregistrerEvenement: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    mockEvenementService = {
      enregistrerEvenement: vi.fn().mockResolvedValue({
        id: "evt-test-123",
        typeEvenement: TypeEvenement.VISITE,
        dateCreation: new Date().toISOString(),
        success: true,
      }),
    };

    app = await createThrottledTestApp({
      controller: EvenementsController,
      providers: [{ provide: EvenementService, useValue: mockEvenementService }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /evenements", () => {
    const VALID_ORIGIN = "https://mutafriches.beta.gouv.fr";

    it("devrait enregistrer un evenement avec origine valide", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/evenements")
        .set("Origin", VALID_ORIGIN)
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("success", true);
    });

    it("devrait passer le mode iframe via query param", async () => {
      await request(app.getHttpServer() as App)
        .post("/evenements?iframe=true")
        .set("Origin", VALID_ORIGIN)
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(201);

      expect(mockEvenementService.enregistrerEvenement).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ modeUtilisation: "iframe" }),
      );
    });

    it("devrait passer l'integrateur via query param", async () => {
      await request(app.getHttpServer() as App)
        .post("/evenements?integrateur=benefriches")
        .set("Origin", VALID_ORIGIN)
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(201);

      expect(mockEvenementService.enregistrerEvenement).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ integrateur: "benefriches" }),
      );
    });

    it("devrait rejeter une requete sans origine", async () => {
      await request(app.getHttpServer() as App)
        .post("/evenements")
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(403);
    });

    it("devrait rejeter une origine non autorisee", async () => {
      await request(app.getHttpServer() as App)
        .post("/evenements")
        .set("Origin", "https://malicious-site.com")
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(403);
    });
  });

  // Tests de limitation de débit (limite de 30 req/min pour evenements)
  describeThrottling({
    getApp: () => app,
    method: "post",
    route: "/evenements",
    body: { typeEvenement: TypeEvenement.VISITE },
    headers: { Origin: "https://mutafriches.beta.gouv.fr" },
    requestCount: 35,
  });
});
