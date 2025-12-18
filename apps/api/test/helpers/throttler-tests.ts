import { INestApplication } from "@nestjs/common";
import { describe, it, expect } from "vitest";
import request from "supertest";
import { App } from "supertest/types";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface ThrottlerTestConfig {
  getApp: () => INestApplication;
  method: HttpMethod;
  route: string;
  body?: Record<string, unknown>;
}

/**
 * Genere un bloc describe avec les tests de rate limiting standards
 * Teste que le throttler bloque les requetes au-dela de la limite
 *
 * @param config.getApp - Fonction qui retourne l'app (pour acceder a app apres beforeAll)
 * @param config.method - Methode HTTP (get, post, etc.)
 * @param config.route - Route a tester
 * @param config.body - Body optionnel pour les requetes POST/PUT/PATCH
 */
export function describeThrottling(config: ThrottlerTestConfig): void {
  const { getApp, method, route, body } = config;

  describe("Rate Limiter", () => {
    it("devrait retourner 429 quand la limite est depassee", async () => {
      const app = getApp();
      const requests = Array.from({ length: 10 }, () => {
        const req = request(app.getHttpServer() as App)[method](route);
        if (body) {
          return req.send(body);
        }
        return req;
      });

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter((r) => r.status === 429);

      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    it("devrait retourner le message Too Many Requests", async () => {
      const app = getApp();
      const requests = Array.from({ length: 10 }, () => {
        const req = request(app.getHttpServer() as App)[method](route);
        if (body) {
          return req.send(body);
        }
        return req;
      });

      const responses = await Promise.all(requests);
      const blockedResponse = responses.find((r) => r.status === 429);

      if (blockedResponse) {
        expect(blockedResponse.body.message).toContain("Too Many Requests");
      }
    });
  });
}
