import { describe, it, expect, beforeEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { ZaerWfsService } from "./zaer-wfs.service";

describe("ZaerWfsService", () => {
  let service: ZaerWfsService;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGet = vi.fn();
    service = new ZaerWfsService({ get: httpGet } as unknown as HttpService);
  });

  const feature = (properties: Record<string, unknown>) => ({
    type: "Feature",
    id: "zaer.1",
    geometry: null,
    properties,
  });

  const collection = (features: unknown[]) => of({ data: { type: "FeatureCollection", features } });

  const paramsDuDernierAppel = () =>
    (httpGet.mock.calls.at(-1)?.[1] as { params: Record<string, string> }).params;

  describe("zones d'accélération", () => {
    it("interroge la couche zaer:zaer sans demander le champ zonage", async () => {
      httpGet.mockReturnValue(collection([]));

      await service.findZaerAtPoint(47.25, 6.03);

      const params = paramsDuDernierAppel();
      expect(params.typename).toBe("zaer:zaer");
      expect(params.propertyName).not.toContain("zonage");
      expect(params.CQL_FILTER).toBe("INTERSECTS(geom,POINT(47.25 6.03))");
    });

    it("coalesce les niveaux de detail_filiere et déduplique", async () => {
      httpGet.mockReturnValue(
        collection([
          feature({
            nom: "Zone communale",
            filiere: "SOLAIRE_PV",
            detail_filiere1: "SOLAIRE_PV_NV_SOL",
            detail_filiere2: "OMBRIERE",
            detail_filiere3: null,
          }),
          feature({
            nom: "Zone communale",
            filiere: "SOLAIRE_PV",
            detail_filiere1: "SOLAIRE_PV_NV_SOL",
            detail_filiere2: "OMBRIERE",
            detail_filiere3: null,
          }),
        ]),
      );

      const res = await service.findZaerAtPoint(47.25, 6.03);

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].detailFiliere).toBe("SOLAIRE_PV_NV_SOL / OMBRIERE");
    });

    it("retourne une erreur sans throw quand le WFS échoue", async () => {
      httpGet.mockReturnValue(throwError(() => new Error("503")));

      const res = await service.findZaerAtPoint(47.25, 6.03);

      expect(res.success).toBe(false);
      expect(httpGet).toHaveBeenCalledTimes(1);
    });
  });

  describe("zones d'interdiction", () => {
    it("interroge la couche OFB des interdictions avec le même filtre", async () => {
      httpGet.mockReturnValue(collection([]));

      await service.findExclusionAtPoint(45.88, -1.07);

      const params = paramsDuDernierAppel();
      expect(params.typename).toBe(
        "OFB_INTERDICTION-ZAER-SAUF-TOITURE:zones_exclues_aires_acceleration_sauf_toiture",
      );
      expect(params.propertyName).toContain("zonage");
      expect(params.CQL_FILTER).toBe("INTERSECTS(geom,POINT(45.88 -1.07))");
    });

    it("remonte le régime brut de chaque zone d'interdiction", async () => {
      httpGet.mockReturnValue(
        collection([
          feature({
            code: "FR3600077",
            nom_zone: "Moëze-Oléron",
            type_zone: "Réserve naturelle nationale",
            zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
          }),
          feature({
            code: "FR5410028",
            nom_zone: "Marais de Brouage",
            type_zone: "Zone de protection spéciale (ZPS)",
            zonage: "Interdiction ZAER (loi APER) éolien uniquement",
          }),
        ]),
      );

      const res = await service.findExclusionAtPoint(45.88, -1.07);

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(2);
      expect(res.data?.[0]).toEqual({
        code: "FR3600077",
        nomZone: "Moëze-Oléron",
        typeZone: "Réserve naturelle nationale",
        zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
      });
    });

    it("déduplique les zones identiques", async () => {
      const props = {
        code: "FR3600077",
        nom_zone: "Moëze-Oléron",
        type_zone: "Réserve naturelle nationale",
        zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
      };
      httpGet.mockReturnValue(collection([feature(props), feature(props)]));

      const res = await service.findExclusionAtPoint(45.88, -1.07);

      expect(res.data).toHaveLength(1);
    });

    it("utilise INTERSECTS sur la géométrie quand elle est disponible", async () => {
      httpGet.mockReturnValue(collection([]));

      await service.findExclusionIntersectingSite({
        type: "Polygon",
        coordinates: [
          [
            [6.03, 47.25],
            [6.04, 47.25],
            [6.04, 47.26],
            [6.03, 47.25],
          ],
        ],
      });

      // Le WFS EPSG:4326 attend (lat, lon), l'inverse du GeoJSON
      expect(paramsDuDernierAppel().CQL_FILTER).toBe(
        "INTERSECTS(geom,POLYGON((47.25 6.03,47.25 6.04,47.26 6.04,47.25 6.03)))",
      );
    });
  });
});
