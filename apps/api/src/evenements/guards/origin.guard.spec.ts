import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { OriginGuard } from "./origin.guard";

describe("OriginGuard", () => {
  let guard: OriginGuard;

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
    delete process.env.ALLOWED_ORIGINS;
    guard = new OriginGuard();
  });

  describe("Origines autorisees par defaut", () => {
    it("devrait accepter mutafriches.beta.gouv.fr", () => {
      const context = createMockContext({ origin: "https://mutafriches.beta.gouv.fr" });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait accepter mutafriches.incubateur.ademe.dev", () => {
      const context = createMockContext({ origin: "https://mutafriches.incubateur.ademe.dev" });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("devrait accepter localhost:5173", () => {
      const context = createMockContext({ origin: "http://localhost:5173" });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("Origines non autorisees", () => {
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
