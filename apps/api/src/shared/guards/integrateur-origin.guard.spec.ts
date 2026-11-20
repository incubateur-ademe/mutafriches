import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { IntegrateurOriginGuard } from "./integrateur-origin.guard";
import { creerRegistreDeTest } from "../../integrateurs/__test-helpers__/registre.mocks";

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

function creerGuard(originesDeclarees: string[] = []): IntegrateurOriginGuard {
  return new IntegrateurOriginGuard(creerRegistreDeTest(originesDeclarees));
}

describe("IntegrateurOriginGuard", () => {
  const nodeEnvInitial = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = nodeEnvInitial;
  });

  describe("Mode développement (bypass)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("autorise toute requête, même sans origine", async () => {
      await expect(creerGuard().canActivate(createMockExecutionContext({}))).resolves.toBe(true);
    });

    it("autorise une origine non déclarée", async () => {
      const context = createMockExecutionContext({ origin: "https://malicious-site.com" });
      await expect(creerGuard().canActivate(context)).resolves.toBe(true);
    });
  });

  describe("Nos origines, codées", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it.each(["https://mutafriches.beta.gouv.fr", "https://mutafriches.incubateur.ademe.dev"])(
      "autorise %s sans rien en base",
      async (origin) => {
        await expect(
          creerGuard().canActivate(createMockExecutionContext({ origin })),
        ).resolves.toBe(true);
      },
    );

    it("n'autorise pas benefriches.ademe.fr tant qu'il n'est pas déclaré", async () => {
      const context = createMockExecutionContext({ origin: "https://benefriches.ademe.fr" });
      await expect(creerGuard().canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Origines déclarées dans le registre", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("autorise une origine déclarée", async () => {
      const guard = creerGuard(["https://benefriches.ademe.fr"]);
      const context = createMockExecutionContext({ origin: "https://benefriches.ademe.fr" });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it("normalise l'origine reçue (casse, slash final, port par défaut)", async () => {
      const guard = creerGuard(["https://partenaire.fr"]);
      for (const origin of [
        "https://Partenaire.FR",
        "https://partenaire.fr/",
        "https://partenaire.fr:443",
      ]) {
        await expect(guard.canActivate(createMockExecutionContext({ origin }))).resolves.toBe(true);
      }
    });

    it("conserve un port non standard", async () => {
      const guard = creerGuard(["https://partenaire.fr:8443"]);
      await expect(
        guard.canActivate(createMockExecutionContext({ origin: "https://partenaire.fr:8443" })),
      ).resolves.toBe(true);
      await expect(
        guard.canActivate(createMockExecutionContext({ origin: "https://partenaire.fr" })),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Origines bloquées", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("bloque une origine non déclarée", async () => {
      const context = createMockExecutionContext({ origin: "https://malicious-site.com" });
      await expect(creerGuard().canActivate(context)).rejects.toThrow("Origin not allowed");
    });

    it("bloque une requête sans origin ni referer", async () => {
      await expect(creerGuard().canActivate(createMockExecutionContext({}))).rejects.toThrow(
        "Origin required",
      );
    });

    it("bloque localhost hors développement", async () => {
      const context = createMockExecutionContext({ origin: "http://localhost:5173" });
      await expect(creerGuard().canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it.each([
      "https://benefriches.ademe.fr.attacker.com",
      "https://benefriches.ademe.fr.evil.io",
      "https://sub.benefriches.ademe.fr",
      "http://benefriches.ademe.fr",
    ])("bloque %s quand seul https://benefriches.ademe.fr est déclaré", async (origin) => {
      const guard = creerGuard(["https://benefriches.ademe.fr"]);
      await expect(guard.canActivate(createMockExecutionContext({ origin }))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("bloque un suffixe usurpé de notre propre domaine", async () => {
      const context = createMockExecutionContext({
        origin: "https://mutafriches.beta.gouv.fr.attacker.com",
      });
      await expect(creerGuard().canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it("bloque Origin: null", async () => {
      const context = createMockExecutionContext({ origin: "null" });
      await expect(creerGuard().canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Extraction de l'origine", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("priorise le header Origin sur Referer", async () => {
      const context = createMockExecutionContext({
        origin: "https://mutafriches.beta.gouv.fr",
        referer: "https://malicious-site.com/page",
      });
      await expect(creerGuard().canActivate(context)).resolves.toBe(true);
    });

    it("utilise l'origine du Referer, sans son chemin, si Origin est absent", async () => {
      const context = createMockExecutionContext({
        referer: "https://mutafriches.beta.gouv.fr/some/path?query=1",
      });
      await expect(creerGuard().canActivate(context)).resolves.toBe(true);
    });

    it("refuse un Referer invalide", async () => {
      const context = createMockExecutionContext({ referer: "not-a-valid-url" });
      await expect(creerGuard().canActivate(context)).rejects.toThrow("Origin required");
    });
  });

  describe("Mode staging", () => {
    it("applique les mêmes règles qu'en production", async () => {
      process.env.NODE_ENV = "staging";
      const guard = creerGuard();
      await expect(
        guard.canActivate(
          createMockExecutionContext({ origin: "https://mutafriches.beta.gouv.fr" }),
        ),
      ).resolves.toBe(true);
      await expect(
        guard.canActivate(createMockExecutionContext({ origin: "https://malicious-site.com" })),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
