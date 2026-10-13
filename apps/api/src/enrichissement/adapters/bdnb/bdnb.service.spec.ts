import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { BdnbService } from "./bdnb.service";

const groupes = (surfaces: number[]): Record<string, unknown>[] =>
  surfaces.map((surface_emprise_sol, i) => ({
    batiment_groupe_id: `bg-${i}`,
    surface_emprise_sol,
  }));

const erreurHttp = (status: number, headers: Record<string, string> = {}): unknown => ({
  message: `Request failed with status code ${status}`,
  response: { status, headers },
});

describe("BdnbService", () => {
  let service: BdnbService;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    httpGet = vi.fn();
    service = new BdnbService({ get: httpGet } as unknown as HttpService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const surfaceBatie = async (): Promise<Awaited<ReturnType<BdnbService["getSurfaceBatie"]>>> => {
    const promesse = service.getSurfaceBatie("49020000AK0118");
    await vi.runAllTimersAsync();
    return promesse;
  };

  it("somme les surfaces des groupes de bâtiments", async () => {
    httpGet.mockReturnValue(of({ data: groupes([69, 31]) }));

    const result = await surfaceBatie();

    expect(result).toMatchObject({ success: true, data: 100 });
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it("renvoie 0 pour une parcelle non bâtie (tableau vide)", async () => {
    httpGet.mockReturnValue(of({ data: [] }));

    const result = await surfaceBatie();

    expect(result).toMatchObject({ success: true, data: 0 });
  });

  it("pagine par pages de 10 : l'API ignore un limit supérieur", async () => {
    httpGet
      .mockReturnValueOnce(of({ data: groupes(Array(10).fill(100)) }))
      .mockReturnValueOnce(of({ data: groupes([50, 25]) }));

    const result = await surfaceBatie();

    expect(result).toMatchObject({ success: true, data: 1075 });
    expect(httpGet).toHaveBeenCalledTimes(2);
    const params = httpGet.mock.calls.map(
      (appel) => (appel[1] as { params: Record<string, unknown> }).params,
    );
    expect(params[0]).toMatchObject({ limit: 10, offset: 0, select: "surface_emprise_sol" });
    expect(params[1]).toMatchObject({ limit: 10, offset: 10 });
  });

  it("signale un échec plutôt qu'une surface tronquée au-delà du plafond de pages", async () => {
    httpGet.mockReturnValue(of({ data: groupes(Array(10).fill(1)) }));

    const result = await surfaceBatie();

    expect(result.success).toBe(false);
    expect(httpGet).toHaveBeenCalledTimes(30);
  });

  it("réessaie après un 429 en attendant la remise à zéro de la fenêtre", async () => {
    httpGet
      .mockReturnValueOnce(
        throwError(() => erreurHttp(429, { "x-rate-limit-reset": String(Date.now() + 2000) })),
      )
      .mockReturnValueOnce(of({ data: groupes([69]) }));

    const result = await surfaceBatie();

    expect(result).toMatchObject({ success: true, data: 69 });
    expect(httpGet).toHaveBeenCalledTimes(2);
  });

  it("réessaie après une erreur 5xx puis un timeout", async () => {
    httpGet
      .mockReturnValueOnce(throwError(() => erreurHttp(503)))
      .mockReturnValueOnce(throwError(() => new Error("timeout of 10000ms exceeded")))
      .mockReturnValueOnce(of({ data: groupes([69]) }));

    const result = await surfaceBatie();

    expect(result).toMatchObject({ success: true, data: 69 });
    expect(httpGet).toHaveBeenCalledTimes(3);
  });

  it("abandonne après 3 tentatives sans présenter l'échec comme un terrain non bâti", async () => {
    httpGet.mockReturnValue(throwError(() => erreurHttp(429)));

    const result = await surfaceBatie();

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(httpGet).toHaveBeenCalledTimes(3);
  });

  it("ne réessaie pas sur une erreur 4xx autre que 429", async () => {
    httpGet.mockReturnValue(throwError(() => erreurHttp(400)));

    const result = await surfaceBatie();

    expect(result.success).toBe(false);
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it("traite une réponse 200 qui n'est pas un tableau comme un échec", async () => {
    httpGet.mockReturnValue(of({ data: { code: "57014", message: "statement timeout" } }));

    const result = await surfaceBatie();

    expect(result.success).toBe(false);
  });
});
