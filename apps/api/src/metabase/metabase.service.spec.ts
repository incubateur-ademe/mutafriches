import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as jwt from "jsonwebtoken";
import { MetabaseService } from "./metabase.service";

describe("MetabaseService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isConfigured", () => {
    it("retourne true quand les variables sont presentes", () => {
      process.env.METABASE_SITE_URL = "https://metabase.example.com";
      process.env.METABASE_SECRET_KEY = "secret-key-123";

      const service = new MetabaseService();
      expect(service.isConfigured()).toBe(true);
    });

    it("retourne false quand METABASE_SITE_URL est absente", () => {
      delete process.env.METABASE_SITE_URL;
      process.env.METABASE_SECRET_KEY = "secret-key-123";

      const service = new MetabaseService();
      expect(service.isConfigured()).toBe(false);
    });

    it("retourne false quand METABASE_SECRET_KEY est absente", () => {
      process.env.METABASE_SITE_URL = "https://metabase.example.com";
      delete process.env.METABASE_SECRET_KEY;

      const service = new MetabaseService();
      expect(service.isConfigured()).toBe(false);
    });

    it("retourne false quand aucune variable n'est presente", () => {
      delete process.env.METABASE_SITE_URL;
      delete process.env.METABASE_SECRET_KEY;

      const service = new MetabaseService();
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe("generateEmbedUrl", () => {
    it("genere une URL valide avec un token JWT decodable", () => {
      process.env.METABASE_SITE_URL = "https://metabase.example.com";
      process.env.METABASE_SECRET_KEY = "super-secret-key";

      const service = new MetabaseService();
      const url = service.generateEmbedUrl();

      expect(url).toMatch(
        /^https:\/\/metabase\.example\.com\/embed\/dashboard\/.+#bordered=true&titled=true$/,
      );

      // Extraire et decoder le token
      const token = url.split("/embed/dashboard/")[1].split("#")[0];
      const decoded = jwt.verify(token, "super-secret-key") as {
        resource: { dashboard: number };
        params: Record<string, unknown>;
        exp: number;
      };

      expect(decoded.resource).toEqual({ dashboard: 3 });
      expect(decoded.params).toEqual({});
      expect(decoded.exp).toBeGreaterThan(Math.round(Date.now() / 1000));
    });

    it("utilise le dashboard ID personnalise depuis l'env", () => {
      process.env.METABASE_SITE_URL = "https://metabase.example.com";
      process.env.METABASE_SECRET_KEY = "super-secret-key";
      process.env.METABASE_DASHBOARD_ID = "7";

      const service = new MetabaseService();
      const url = service.generateEmbedUrl();

      const token = url.split("/embed/dashboard/")[1].split("#")[0];
      const decoded = jwt.verify(token, "super-secret-key") as {
        resource: { dashboard: number };
      };

      expect(decoded.resource).toEqual({ dashboard: 7 });
    });

    it("leve une erreur si Metabase n'est pas configure", () => {
      delete process.env.METABASE_SITE_URL;
      delete process.env.METABASE_SECRET_KEY;

      const service = new MetabaseService();
      expect(() => service.generateEmbedUrl()).toThrow("Metabase non configure");
    });
  });
});
