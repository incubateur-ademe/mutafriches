import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { OriginGuard } from "./origin.guard";

describe("OriginGuard (Evenements - Mutafriches uniquement)", () => {
  let guard: OriginGuard;
  let originalNodeEnv: string | undefined;

  const createMockContext = (headers: Record<string, string | undefined>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          ip: "127.0.0.1",
          url: "/evenements",
        }),
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    delete process.env.ALLOWED_ORIGINS;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.ALLOWED_ORIGINS;
  });

  describe("Origines Mutafriches (toujours autorisees)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      guard = new OriginGuard();
    });

    it("devrait accepter mutafriches.beta.gouv.fr", () => {
      const context = createMockContext({ origin: "https://mutafriches.beta.gouv.fr" });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait accepter mutafriches.incubateur.ademe.dev (staging)", () => {
      const context = createMockContext({ origin: "https://mutafriches.incubateur.ademe.dev" });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("Localhost en mode developpement", () => {
    it("devrait accepter localhost:5173 en developpement", () => {
      process.env.NODE_ENV = "development";
      guard = new OriginGuard();

      const context = createMockContext({ origin: "http://localhost:5173" });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait rejeter localhost:5173 en production", () => {
      process.env.NODE_ENV = "production";
      guard = new OriginGuard();

      const context = createMockContext({ origin: "http://localhost:5173" });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("devrait rejeter localhost:5173 en staging", () => {
      process.env.NODE_ENV = "staging";
      guard = new OriginGuard();

      const context = createMockContext({ origin: "http://localhost:5173" });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("Origines des integrateurs (NON autorisees)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      guard = new OriginGuard();
    });

    it("devrait rejeter benefriches (tracking interne uniquement)", () => {
      const context = createMockContext({ origin: "https://benefriches.ademe.fr" });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("devrait rejeter benefriches staging", () => {
      const context = createMockContext({ origin: "https://benefriches.incubateur.ademe.dev" });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("Origines non autorisees", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      guard = new OriginGuard();
    });

    it("devrait rejeter une origine inconnue", () => {
      const context = createMockContext({ origin: "https://malicious-site.com" });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("devrait rejeter localhost sur un autre port", () => {
      const context = createMockContext({ origin: "http://localhost:3000" });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("devrait rejeter une requete sans Origin ni Referer", () => {
      const context = createMockContext({});
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("Fallback sur Referer", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      guard = new OriginGuard();
    });

    it("devrait utiliser Referer si Origin absent", () => {
      const context = createMockContext({
        referer: "https://mutafriches.beta.gouv.fr/parcelle/123",
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait extraire l'origine du Referer correctement", () => {
      const context = createMockContext({
        referer: "https://mutafriches.incubateur.ademe.dev/enrichissement?id=456",
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait rejeter un Referer non autorise", () => {
      const context = createMockContext({
        referer: "https://attacker.com/page",
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("devrait rejeter un Referer invalide", () => {
      const context = createMockContext({
        referer: "not-a-valid-url",
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("Configuration via variable d'environnement", () => {
    it("devrait utiliser ALLOWED_ORIGINS si definie", () => {
      process.env.ALLOWED_ORIGINS = "https://custom-domain.fr,https://autre-domaine.fr";
      const customGuard = new OriginGuard();

      const contextAllowed = createMockContext({ origin: "https://custom-domain.fr" });
      expect(customGuard.canActivate(contextAllowed)).toBe(true);

      const contextDefault = createMockContext({ origin: "https://mutafriches.beta.gouv.fr" });
      expect(() => customGuard.canActivate(contextDefault)).toThrow(ForbiddenException);
    });

    it("devrait gerer les espaces dans ALLOWED_ORIGINS", () => {
      process.env.ALLOWED_ORIGINS = "https://domain1.fr , https://domain2.fr";
      const customGuard = new OriginGuard();

      const context = createMockContext({ origin: "https://domain2.fr" });
      expect(customGuard.canActivate(context)).toBe(true);
    });
  });
});
