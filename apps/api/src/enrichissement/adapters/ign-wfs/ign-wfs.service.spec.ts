import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { IgnWfsService } from "./ign-wfs.service";

describe("IgnWfsService", () => {
  let service: IgnWfsService;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGet = vi.fn();
    service = new IgnWfsService({ get: httpGet } as unknown as HttpService);
  });

  const collection = (features: unknown[]) => of({ data: { type: "FeatureCollection", features } });

  it("interroge le WFS avec un filtre serveur DWITHIN + nature/importance (sans BBOX)", async () => {
    // Le filtrage serveur évite le plafond de 5000 tronçons qui tronquait la BBOX large (ADR-0028).
    httpGet.mockReturnValue(collection([]));

    await service.getDistanceVoieGrandeCirculation(45.35, 4.807, 15000);

    const config = httpGet.mock.calls[0][1] as { params: Record<string, string> };
    const cql = config.params.CQL_FILTER;
    expect(config.params.BBOX).toBeUndefined();
    expect(cql).toContain("DWITHIN(geometrie,POINT(45.35 4.807),15000,meters)");
    expect(cql).toContain("Type autoroutier");
    expect(cql).toContain("Route à 2 chaussées");
    expect(cql).toContain("importance IN ('1','2')");
  });

  it("retourne la distance au tronçon de grande circulation le plus proche", async () => {
    httpGet.mockReturnValue(
      collection([
        {
          type: "Feature",
          properties: { nature: "Type autoroutier", importance: "1" },
          geometry: {
            type: "LineString",
            coordinates: [
              [4.808, 45.349],
              [4.808, 45.351],
            ],
          },
        },
      ]),
    );

    const res = await service.getDistanceVoieGrandeCirculation(45.35, 4.807, 15000);

    expect(res.success).toBe(true);
    expect(res.data?.distanceMetres).toBeGreaterThan(0);
    expect(res.data?.distanceMetres).toBeLessThan(15000);
    expect(res.data?.nombreTronconsProches).toBe(1);
  });

  it("échoue proprement si aucun tronçon n'est renvoyé", async () => {
    httpGet.mockReturnValue(collection([]));

    const res = await service.getDistanceVoieGrandeCirculation(45.35, 4.807, 15000);

    expect(res.success).toBe(false);
    expect(res.error).toContain("rayon");
  });
});
