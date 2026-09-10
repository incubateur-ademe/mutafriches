import { HttpService } from "@nestjs/axios";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FCU_TIMEOUT_MS } from "./france-chaleur-urbaine.constants";
import { FranceChaleurUrbaineService } from "./france-chaleur-urbaine.service";

describe("FranceChaleurUrbaineService", () => {
  let service: FranceChaleurUrbaineService;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGet = vi.fn();
    service = new FranceChaleurUrbaineService({ get: httpGet } as unknown as HttpService);
  });

  it("interroge /v1/eligibility avec lat/lon et un timeout court", async () => {
    httpGet.mockReturnValue(of({ data: { distance: 72, futurNetwork: false } }));

    await service.getEligibilite(48.8566, 2.3522);

    const [url, config] = httpGet.mock.calls[0] as [
      string,
      { params: Record<string, number>; timeout: number },
    ];
    expect(url).toContain("/v1/eligibility");
    expect(config.params).toEqual({ lat: 48.8566, lon: 2.3522 });
    expect(config.timeout).toBe(FCU_TIMEOUT_MS);
  });

  it("retourne la distance au réseau le plus proche", async () => {
    httpGet.mockReturnValue(
      of({
        data: { distance: 444, futurNetwork: false, id: "6905C", name: "Réseau de Lyon" },
      }),
    );

    const resultat = await service.getEligibilite(45.764, 4.8357);

    expect(resultat.success).toBe(true);
    expect(resultat.data?.distance).toBe(444);
    expect(resultat.source).toBe(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("remonte une distance nulle telle quelle (aucun réseau, ou tracé indisponible)", async () => {
    httpGet.mockReturnValue(of({ data: { distance: null, futurNetwork: false, id: null } }));

    const resultat = await service.getEligibilite(44.4, 3.5);

    expect(resultat.success).toBe(true);
    expect(resultat.data?.distance).toBeNull();
  });

  it("ne propage pas l'erreur HTTP et retourne un échec typé", async () => {
    httpGet.mockReturnValue(throwError(() => new Error("timeout of 3000ms exceeded")));

    const resultat = await service.getEligibilite(48.8566, 2.3522);

    expect(resultat.success).toBe(false);
    expect(resultat.error).toContain("timeout");
    expect(resultat.data).toBeUndefined();
  });
});
