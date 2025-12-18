import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { EnrichissementController } from "../src/enrichissement/enrichissement.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 5, // Limite basse pour les tests
          },
        ]),
      ],
      controllers: [EnrichissementController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: EnrichissementService,
          useValue: mockEnrichissementService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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

  describe("Rate Limiter", () => {
    it("devrait retourner 429 quand la limite est depassee", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App)
          .post("/enrichissement")
          .send({ identifiant: "49007000AB0123" }),
      );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);

      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    it("devrait retourner le message Too Many Requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer() as App)
          .post("/enrichissement")
          .send({ identifiant: "49007000AB0123" }),
      );

      const responses = await Promise.all(requests);
      const blockedResponse = responses.find((r) => r.status === 429);

      if (blockedResponse) {
        expect(blockedResponse.body.message).toContain("Too Many Requests");
      }
    });
  });
});
