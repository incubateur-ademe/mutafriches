import { describe, it, expect } from "vitest";
import { SourceUtilisation } from "@mutafriches/shared-types";
import { OrigineDetectionService } from "./origine-detection.service";

describe("OrigineDetectionService", () => {
  let service: OrigineDetectionService;

  beforeEach(() => {
    service = new OrigineDetectionService();
  });

  describe("detecterOrigine", () => {
    describe("Mode iframe force via query param", () => {
      it("devrait retourner IFRAME_INTEGREE quand iframe=true", () => {
        const result = service.detecterOrigine(undefined, true, "cartofriches");

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "cartofriches",
        });
      });

      it("devrait utiliser 'unknown' si iframe=true sans integrateur", () => {
        const result = service.detecterOrigine(undefined, true);

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "unknown",
        });
      });

      it("devrait gerer iframe avec string 'true'", () => {
        const result = service.detecterOrigine(undefined, "true" as any, "partner");

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "partner",
        });
      });

      it("devrait ignorer iframe='false'", () => {
        const result = service.detecterOrigine(undefined, "false" as any);

        expect(result).toEqual({
          source: SourceUtilisation.API_DIRECTE,
        });
      });
    });

    describe("Sans requete HTTP", () => {
      it("devrait retourner API_DIRECTE sans requete", () => {
        const result = service.detecterOrigine();

        expect(result).toEqual({
          source: SourceUtilisation.API_DIRECTE,
        });
      });

      it("devrait retourner API_DIRECTE avec requete undefined", () => {
        const result = service.detecterOrigine(undefined, false);

        expect(result).toEqual({
          source: SourceUtilisation.API_DIRECTE,
        });
      });
    });

    describe("Detection depuis referer", () => {
      it("devrait detecter API_DIRECTE si referer contient /api", () => {
        const req = {
          headers: { referer: "https://mutafriches.beta.gouv.fr/api/docs" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.API_DIRECTE,
        });
      });

      it("devrait detecter API_DIRECTE si referer se termine par /api", () => {
        const req = {
          headers: { referer: "https://example.com/api" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.API_DIRECTE,
        });
      });

      it("devrait detecter SITE_STANDALONE depuis localhost", () => {
        const req = {
          headers: { referer: "http://localhost:3000/parcelle" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.SITE_STANDALONE,
        });
      });

      it("devrait detecter SITE_STANDALONE depuis 127.0.0.1", () => {
        const req = {
          headers: { referer: "http://127.0.0.1:5173/iframe" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.SITE_STANDALONE,
        });
      });

      it("devrait detecter SITE_STANDALONE depuis mutafriches.beta.gouv.fr", () => {
        const req = {
          headers: { referer: "https://mutafriches.beta.gouv.fr/evaluation" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.SITE_STANDALONE,
        });
      });

      it("devrait detecter SITE_STANDALONE depuis mutafriches.incubateur.ademe.dev", () => {
        const req = {
          headers: { referer: "https://mutafriches.incubateur.ademe.dev/parcelle" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.SITE_STANDALONE,
        });
      });

      it("devrait detecter IFRAME_INTEGREE depuis domaine externe", () => {
        const req = {
          headers: { referer: "https://cartofriches.fr/map" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "cartofriches.fr",
        });
      });

      it("devrait extraire integrateur depuis referer avec path", () => {
        const req = {
          headers: { referer: "https://urbanvitaliz.fr/projects/123/friches" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "urbanvitaliz.fr",
        });
      });
    });

    describe("Detection depuis origin (fallback)", () => {
      it("devrait utiliser origin si referer absent", () => {
        const req = {
          headers: { origin: "https://external-site.com" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "external-site.com",
        });
      });

      it("devrait detecter SITE_STANDALONE depuis origin localhost", () => {
        const req = {
          headers: { origin: "http://localhost:3000" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.SITE_STANDALONE,
        });
      });
    });

    describe("Gestion des cas limites", () => {
      it("devrait utiliser referrer (avec double r) comme fallback", () => {
        const req = {
          headers: { referrer: "https://example.com" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "example.com",
        });
      });

      it("devrait gerer referer invalide (URL malformee)", () => {
        const req = {
          headers: { referer: "not-a-valid-url" },
        } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: undefined,
        });
      });

      it("devrait gerer headers vides", () => {
        const req = { headers: {} } as any;

        const result = service.detecterOrigine(req);

        expect(result).toEqual({
          source: SourceUtilisation.API_DIRECTE,
        });
      });

      it("devrait prioriser iframe=true sur detection automatique", () => {
        const req = {
          headers: { referer: "http://localhost:3000" },
        } as any;

        const result = service.detecterOrigine(req, true, "forced-partner");

        expect(result).toEqual({
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: "forced-partner",
        });
      });
    });
  });
});
