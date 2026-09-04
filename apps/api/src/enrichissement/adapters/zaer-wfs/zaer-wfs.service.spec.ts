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

  const erreurHttp = (status: number) =>
    throwError(() =>
      Object.assign(new Error(`Request failed with status code ${status}`), {
        response: { status },
      }),
    );

  it("demande le champ zonage au WFS", async () => {
    httpGet.mockReturnValue(collection([]));

    await service.findZaerAtPoint(47.25, 6.03);

    const config = httpGet.mock.calls[0][1] as { params: Record<string, string> };
    expect(config.params.propertyName).toContain("zonage");
  });

  it("remonte le zonage APER de chaque zone", async () => {
    httpGet.mockReturnValue(
      collection([
        feature({
          nom: "Zone d'interdiction",
          filiere: "SOLAIRE_PV",
          detail_filiere1: "SOLAIRE_PV_NV_SOL",
          detail_filiere2: null,
          detail_filiere3: null,
          zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
        }),
      ]),
    );

    const res = await service.findZaerAtPoint(47.25, 6.03);

    expect(res.success).toBe(true);
    expect(res.data?.[0].zonage).toBe("Interdiction ZAER (loi APER) toutes ENR sauf toiture");
  });

  it("distingue deux zones de même filière mais de zonage différent", async () => {
    httpGet.mockReturnValue(
      collection([
        feature({
          nom: "Zone communale",
          filiere: "SOLAIRE_PV",
          detail_filiere1: null,
          detail_filiere2: null,
          detail_filiere3: null,
          zonage: "Zone d'accélération",
        }),
        feature({
          nom: "Zone communale",
          filiere: "SOLAIRE_PV",
          detail_filiere1: null,
          detail_filiere2: null,
          detail_filiere3: null,
          zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
        }),
      ]),
    );

    const res = await service.findZaerAtPoint(47.25, 6.03);

    expect(res.data).toHaveLength(2);
  });

  it("rejoue sans le champ zonage si le WFS le rejette", async () => {
    httpGet.mockReturnValueOnce(erreurHttp(400)).mockReturnValueOnce(
      collection([
        feature({
          nom: "Zone éolien",
          filiere: "EOLIEN",
          detail_filiere1: null,
          detail_filiere2: null,
          detail_filiere3: null,
        }),
      ]),
    );

    const res = await service.findZaerAtPoint(47.25, 6.03);

    expect(res.success).toBe(true);
    expect(res.data?.[0].zonage).toBeNull();
    const repli = httpGet.mock.calls[1][1] as { params: Record<string, string> };
    expect(repli.params.propertyName).not.toContain("zonage");
  });

  it("ne rejoue pas sur une erreur qui n'est pas un rejet de propriété", async () => {
    httpGet.mockReturnValue(erreurHttp(503));

    const res = await service.findZaerAtPoint(47.25, 6.03);

    expect(res.success).toBe(false);
    expect(httpGet).toHaveBeenCalledTimes(1);
  });
});
