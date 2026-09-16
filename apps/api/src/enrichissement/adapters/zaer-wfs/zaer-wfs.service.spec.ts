import { describe, it, expect, beforeEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { ZaerWfsService } from "./zaer-wfs.service";

describe("ZaerWfsService", () => {
  let service: ZaerWfsService;
  let httpPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpPost = vi.fn();
    service = new ZaerWfsService({ post: httpPost } as unknown as HttpService);
  });

  const feature = (properties: Record<string, unknown>) => ({
    type: "Feature",
    id: "zaer.1",
    geometry: null,
    properties,
  });

  const collection = (features: unknown[]) => of({ data: { type: "FeatureCollection", features } });

  const requeteDuDernierAppel = () => httpPost.mock.calls.at(-1)?.[1] as string;

  describe("zones d'accélération", () => {
    it("interroge la couche zaer:zaer sans demander le champ zonage", async () => {
      httpPost.mockReturnValue(collection([]));

      await service.findZaerAtPoint(47.25, 6.03);

      const requete = requeteDuDernierAppel();
      expect(requete).toContain('typeNames="zaer:zaer"');
      expect(requete).not.toContain("<wfs:PropertyName>zonage</wfs:PropertyName>");
      // Le WFS EPSG:4326 attend (lat, lon), l'inverse du GeoJSON
      expect(requete).toContain("<gml:pos>47.25 6.03</gml:pos>");
    });

    it("coalesce les niveaux de detail_filiere et déduplique", async () => {
      httpPost.mockReturnValue(
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
      httpPost.mockReturnValue(throwError(() => new Error("503")));

      const res = await service.findZaerAtPoint(47.25, 6.03);

      expect(res.success).toBe(false);
      expect(httpPost).toHaveBeenCalledTimes(1);
    });
  });

  describe("zones d'interdiction", () => {
    it("interroge la couche OFB des interdictions avec le même filtre", async () => {
      httpPost.mockReturnValue(collection([]));

      await service.findExclusionAtPoint(45.88, -1.07);

      const requete = requeteDuDernierAppel();
      expect(requete).toContain(
        'typeNames="OFB_INTERDICTION-ZAER-SAUF-TOITURE:zones_exclues_aires_acceleration_sauf_toiture"',
      );
      expect(requete).toContain("<wfs:PropertyName>zonage</wfs:PropertyName>");
      expect(requete).toContain("<gml:pos>45.88 -1.07</gml:pos>");
    });

    it("remonte le régime brut de chaque zone d'interdiction", async () => {
      httpPost.mockReturnValue(
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
      httpPost.mockReturnValue(collection([feature(props), feature(props)]));

      const res = await service.findExclusionAtPoint(45.88, -1.07);

      expect(res.data).toHaveLength(1);
    });

    it("utilise la géométrie du site quand elle est disponible", async () => {
      httpPost.mockReturnValue(collection([]));

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

      const requete = requeteDuDernierAppel();
      // Le WFS EPSG:4326 attend (lat, lon), l'inverse du GeoJSON
      expect(requete).toContain(
        "<gml:posList>47.25 6.03 47.25 6.04 47.26 6.04 47.25 6.03</gml:posList>",
      );
      expect(requete).toContain("<gml:MultiSurface");
      expect(requete).toContain("<fes:ValueReference>geom</fes:ValueReference>");
    });

    it("transporte les trous d'un polygone et les membres d'un multipolygone", async () => {
      httpPost.mockReturnValue(collection([]));

      await service.findExclusionIntersectingSite({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [6.0, 47.0],
              [6.1, 47.0],
              [6.1, 47.1],
              [6.0, 47.0],
            ],
            [
              [6.02, 47.02],
              [6.03, 47.02],
              [6.03, 47.03],
              [6.02, 47.02],
            ],
          ],
          [
            [
              [6.5, 47.5],
              [6.6, 47.5],
              [6.6, 47.6],
              [6.5, 47.5],
            ],
          ],
        ],
      });

      const requete = requeteDuDernierAppel();
      expect(requete.match(/<gml:surfaceMember>/g)).toHaveLength(2);
      expect(requete).toContain("<gml:interior>");
      expect(requete).toContain("<gml:posList>47.02 6.02 47.02 6.03 47.03 6.03 47.02 6.02");
    });

    it("passe une géométrie trop volumineuse pour une URL GET", async () => {
      httpPost.mockReturnValue(collection([]));

      // ~2 000 sommets : le WKT équivalent dépassait la limite d'URL du serveur (8 192 octets)
      const anneau = Array.from({ length: 2000 }, (_, i) => [6.03 + i / 1e6, 47.25 + i / 1e6]);
      anneau.push([6.03, 47.25]);

      const res = await service.findExclusionIntersectingSite({
        type: "Polygon",
        coordinates: [anneau],
      });

      expect(res.success).toBe(true);
      expect(requeteDuDernierAppel().length).toBeGreaterThan(8192);
    });

    it("refuse une géométrie dont une coordonnée n'est pas un nombre", async () => {
      httpPost.mockReturnValue(collection([]));

      const res = await service.findExclusionIntersectingSite({
        type: "Polygon",
        coordinates: [
          [
            [6.03, 47.25],
            [Number.NaN, 47.25],
            [6.04, 47.26],
            [6.03, 47.25],
          ],
        ],
      });

      expect(res.success).toBe(false);
      expect(httpPost).not.toHaveBeenCalled();
    });
  });
});
