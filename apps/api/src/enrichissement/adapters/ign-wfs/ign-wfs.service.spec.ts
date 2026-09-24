import { describe, it, expect, beforeEach, vi } from "vitest";
import { of, throwError } from "rxjs";
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

  it("filtre côté serveur les tronçons autoroutiers et bretelles du rayon (ADR-0028)", async () => {
    httpGet.mockReturnValue(collection([]));

    await service.getTronconsAutoroutiers(45.35, 4.807, 5000);

    const config = httpGet.mock.calls[0][1] as { params: Record<string, string>; timeout: number };
    expect(config.params.CQL_FILTER).toBe(
      "DWITHIN(geometrie,POINT(45.35 4.807),5000,meters) AND nature IN ('Type autoroutier','Bretelle')",
    );
    expect(config.params.PROPERTYNAME).toContain("sens_de_circulation");
    expect(config.timeout).toBeGreaterThan(0);
  });

  it("renvoie les tronçons linéaires et écarte les géométries inexploitables", async () => {
    httpGet.mockReturnValue(
      collection([
        {
          type: "Feature",
          properties: { nature: "Bretelle", sens_de_circulation: "Sens direct" },
          geometry: {
            type: "LineString",
            coordinates: [
              [4.808, 45.349],
              [4.808, 45.351],
            ],
          },
        },
        { type: "Feature", properties: { nature: "Bretelle" }, geometry: null },
      ]),
    );

    const res = await service.getTronconsAutoroutiers(45.35, 4.807, 5000);

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  it("renvoie une liste vide si aucun tronçon n'est dans le rayon", async () => {
    httpGet.mockReturnValue(collection([]));

    const res = await service.getTronconsAutoroutiers(45.35, 4.807, 5000);

    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });

  it("ne lève pas d'exception si le WFS échoue", async () => {
    httpGet.mockReturnValue(throwError(() => new Error("timeout")));

    const res = await service.getTronconsAutoroutiers(45.35, 4.807, 5000);

    expect(res.success).toBe(false);
    expect(res.error).toBe("timeout");
  });
});
