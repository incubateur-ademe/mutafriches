import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { IntegrateurOriginGuard } from "./integrateur-origin.guard";

function createMockExecutionContext(headers: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        ip: "127.0.0.1",
        url: "/test",
      }),
    }),
  } as ExecutionContext;
}

describe("IntegrateurOriginGuard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Mode developpement (bypass)", () => {
    it("devrait autoriser toute requete en mode development", () => {
      process.env.NODE_ENV = "development";
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait autoriser meme sans origin en mode development", () => {
      process.env.NODE_ENV = "development";
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait autoriser origine non listee en mode development", () => {
      process.env.NODE_ENV = "development";
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://malicious-site.com",
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("Mode production - Origines par defaut", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("devrait autoriser mutafriches.beta.gouv.fr", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://mutafriches.beta.gouv.fr",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait autoriser mutafriches.incubateur.ademe.dev", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://mutafriches.incubateur.ademe.dev",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait autoriser benefriches.incubateur.ademe.dev", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://benefriches.incubateur.ademe.dev",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait autoriser benefriches.ademe.fr", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://benefriches.ademe.fr",
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("Mode production - Origines bloquees", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("devrait bloquer une origine non autorisee", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://malicious-site.com",
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow("Origin not allowed");
    });

    it("devrait bloquer une requete sans origin ni referer", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({});

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow("Origin required");
    });

    it("devrait bloquer localhost en production", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "http://localhost:5173",
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow("Origin not allowed");
    });
  });

  describe("Extraction de l'origine", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("devrait prioriser le header Origin sur Referer", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        origin: "https://mutafriches.beta.gouv.fr",
        referer: "https://malicious-site.com/page",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait utiliser Referer si Origin absent", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        referer: "https://mutafriches.beta.gouv.fr/evaluation",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait extraire l'origine du Referer (sans path)", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        referer: "https://benefriches.ademe.fr/projects/123/details?tab=friches",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait gerer un Referer invalide", () => {
      const guard = new IntegrateurOriginGuard();
      const context = createMockExecutionContext({
        referer: "not-a-valid-url",
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow("Origin required");
    });
  });

  describe("Configuration via variable d'environnement", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("devrait ajouter des origines supplementaires via ALLOWED_INTEGRATOR_ORIGINS", () => {
      process.env.ALLOWED_INTEGRATOR_ORIGINS = "https://cartofriches.cerema.fr,https://urbanvitaliz.fr";
      const guard = new IntegrateurOriginGuard();

      const context1 = createMockExecutionContext({
        origin: "https://cartofriches.cerema.fr",
      });
      expect(guard.canActivate(context1)).toBe(true);

      const context2 = createMockExecutionContext({
        origin: "https://urbanvitaliz.fr",
      });
      expect(guard.canActivate(context2)).toBe(true);
    });

    it("devrait gerer les espaces dans ALLOWED_INTEGRATOR_ORIGINS", () => {
      process.env.ALLOWED_INTEGRATOR_ORIGINS = " https://site1.com , https://site2.com ";
      const guard = new IntegrateurOriginGuard();

      const context = createMockExecutionContext({
        origin: "https://site1.com",
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait conserver les origines par defaut avec ALLOWED_INTEGRATOR_ORIGINS", () => {
      process.env.ALLOWED_INTEGRATOR_ORIGINS = "https://new-partner.com";
      const guard = new IntegrateurOriginGuard();

      const context = createMockExecutionContext({
        origin: "https://mutafriches.beta.gouv.fr",
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("Mode staging", () => {
    it("devrait appliquer les memes regles qu'en production", () => {
      process.env.NODE_ENV = "staging";
      const guard = new IntegrateurOriginGuard();

      const contextAllowed = createMockExecutionContext({
        origin: "https://mutafriches.beta.gouv.fr",
      });
      expect(guard.canActivate(contextAllowed)).toBe(true);

      const contextBlocked = createMockExecutionContext({
        origin: "https://malicious-site.com",
      });
      expect(() => guard.canActivate(contextBlocked)).toThrow(ForbiddenException);
    });
  });
});
