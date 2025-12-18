import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { EvenementsController } from "../src/evenements/evenements.controller";
import { EvenementService } from "../src/evenements/services/evenement.service";
import { TypeEvenement } from "@mutafriches/shared-types";

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 5, // Limite basse pour les tests
          },
        ]),
      ],
      controllers: [EvenementsController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: EvenementService,
          useValue: mockEvenementService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /evenements", () => {
    it("devrait enregistrer un evenement", async () => {
      const response = await request(app.getHttpServer() as App)
        .post("/evenements")
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("success", true);
    });

    it("devrait passer le mode iframe via query param", async () => {
      await request(app.getHttpServer() as App)
        .post("/evenements?iframe=true")
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
        .send({ typeEvenement: TypeEvenement.VISITE })
        .expect(201);

      expect(mockEvenementService.enregistrerEvenement).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ integrateur: "benefriches" }),
      );
    });
  });

  describe("Rate Limiter", () => {
    it("devrait retourner 429 quand la limite est depassee", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App)
          .post("/evenements")
          .send({ typeEvenement: TypeEvenement.VISITE }),
      );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);

      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    it("devrait retourner le message Too Many Requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App)
          .post("/evenements")
          .send({ typeEvenement: TypeEvenement.VISITE }),
      );

      const responses = await Promise.all(requests);
      const blockedResponse = responses.find((r) => r.status === 429);

      if (blockedResponse) {
        expect(blockedResponse.body.message).toContain("Too Many Requests");
      }
    });
  });
});
