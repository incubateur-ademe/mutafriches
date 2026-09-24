import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { IgnItineraireService } from "./ign-itineraire.service";

describe("IgnItineraireService", () => {
  let service: IgnItineraireService;
  let httpGet: ReturnType<typeof vi.fn>;

  const depart = { longitude: 6.165, latitude: 48.735 };
  const arrivee = { longitude: 6.1664, latitude: 48.728 };

  const erreur429 = (): unknown => ({
    message: "Too Many Requests",
    response: { status: 429, headers: { "retry-after": "1" } },
  });

  beforeEach(() => {
    httpGet = vi.fn();
    service = new IgnItineraireService({ get: httpGet } as unknown as HttpService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("demande le plus court chemin en voiture entre deux points lon,lat", async () => {
    httpGet.mockReturnValue(of({ data: { distance: 2233.4 } }));

    const res = await service.getDistanceRoutiere(depart, arrivee);

    expect(res.success).toBe(true);
    expect(res.data?.distanceMetres).toBe(2233.4);
    const config = httpGet.mock.calls[0][1] as { params: Record<string, string>; timeout: number };
    expect(config.params).toMatchObject({
      resource: "bdtopo-osrm",
      profile: "car",
      optimization: "shortest",
      start: "6.165,48.735",
      end: "6.1664,48.728",
      distanceUnit: "meter",
    });
    expect(config.timeout).toBeGreaterThan(0);
  });

  it("relance une fois après un 429", async () => {
    vi.useFakeTimers();
    httpGet
      .mockReturnValueOnce(throwError(erreur429))
      .mockReturnValueOnce(of({ data: { distance: 1500 } }));

    const promesse = service.getDistanceRoutiere(depart, arrivee);
    await vi.runAllTimersAsync();
    const res = await promesse;

    expect(httpGet).toHaveBeenCalledTimes(2);
    expect(res.data?.distanceMetres).toBe(1500);
  });

  it("échoue sans lever d'exception si le 429 persiste", async () => {
    vi.useFakeTimers();
    httpGet.mockReturnValue(throwError(erreur429));

    const promesse = service.getDistanceRoutiere(depart, arrivee);
    await vi.runAllTimersAsync();
    const res = await promesse;

    expect(httpGet).toHaveBeenCalledTimes(2);
    expect(res.success).toBe(false);
  });

  it("ne relance pas sur une autre erreur", async () => {
    httpGet.mockReturnValue(throwError(() => new Error("timeout")));

    const res = await service.getDistanceRoutiere(depart, arrivee);

    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(false);
  });

  it("échoue si la réponse ne contient pas de distance", async () => {
    httpGet.mockReturnValue(of({ data: {} }));

    const res = await service.getDistanceRoutiere(depart, arrivee);

    expect(res.success).toBe(false);
  });
});
