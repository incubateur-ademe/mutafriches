import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { BdnbService } from "./bdnb.service";

const PARCELLE = "49020000AK0118";

const groupes = (surfaces: number[], parcelle_id: string = PARCELLE): Record<string, unknown>[] =>
  surfaces.map((surface_emprise_sol, i) => ({
    parcelle_id,
    batiment_groupe_id: `bg-${parcelle_id}-${i}`,
    surface_emprise_sol,
  }));

const erreurHttp = (
  status: number,
  headers: Record<string, string> = {},
  data?: { message: string },
): unknown => ({
  message: `Request failed with status code ${status}`,
  response: { status, headers, data },
});

const erreurQuota = (): unknown =>
  erreurHttp(
    429,
    { "x-quota-remaining": "0" },
    { message: "Quota exceeded! You reached the limit" },
  );

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

  type Lot = Awaited<ReturnType<BdnbService["getSurfacesBatiesParLot"]>>;

  const surfacesLot = async (identifiants: string[] = [PARCELLE]): Promise<Lot> => {
    const promesse = service.getSurfacesBatiesParLot(identifiants);
    await vi.runAllTimersAsync();
    return promesse;
  };

  const surfaceBatie = async (): Promise<{ success: boolean; data?: number }> => {
    const lot = await surfacesLot();
    return { success: lot.success, data: lot.data?.get(PARCELLE)?.surface };
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
    expect(params[0]).toMatchObject({
      limit: 10,
      offset: 0,
      parcelle_id: `in.(${PARCELLE})`,
      select: "parcelle_id,batiment_groupe_id,surface_emprise_sol",
    });
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

  it("n'insiste pas quand le quota mensuel est épuisé et suspend les appels suivants", async () => {
    httpGet.mockReturnValue(throwError(() => erreurQuota()));

    const premier = await surfaceBatie();
    const second = await surfaceBatie();

    expect(premier.success).toBe(false);
    expect(second.success).toBe(false);
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it("sonde de nouveau l'API une fois la pause du quota écoulée", async () => {
    httpGet.mockReturnValueOnce(throwError(() => erreurQuota()));
    await surfaceBatie();

    vi.setSystemTime(Date.now() + 16 * 60 * 1000);
    httpGet.mockReturnValue(of({ data: groupes([69]) }));
    const result = await surfaceBatie();

    expect(result).toMatchObject({ success: true, data: 69 });
  });

  describe("appel groupé", () => {
    const AUTRE = "49020000AK0119";
    const VIDE = "49020000AK0120";

    it("répartit les groupes par parcelle et conserve leur détail", async () => {
      httpGet.mockReturnValue(of({ data: [...groupes([69, 31]), ...groupes([200], AUTRE)] }));

      const result = await surfacesLot([PARCELLE, AUTRE]);

      expect(result.success).toBe(true);
      expect(result.data?.get(PARCELLE)?.surface).toBe(100);
      expect(result.data?.get(PARCELLE)?.groupes).toHaveLength(2);
      expect(result.data?.get(AUTRE)).toMatchObject({ surface: 200 });
      expect(httpGet).toHaveBeenCalledTimes(1);
    });

    it("interroge toutes les parcelles du lot avec un seul filtre", async () => {
      httpGet.mockReturnValue(of({ data: [] }));

      await surfacesLot([PARCELLE, AUTRE]);

      const params = (httpGet.mock.calls[0][1] as { params: Record<string, unknown> }).params;
      expect(params.parcelle_id).toBe(`in.(${PARCELLE},${AUTRE})`);
    });

    it("traite une parcelle absente de la réponse comme non bâtie", async () => {
      httpGet.mockReturnValue(of({ data: groupes([69]) }));

      const result = await surfacesLot([PARCELLE, VIDE]);

      expect(result.data?.get(VIDE)).toEqual({ surface: 0, groupes: [] });
    });

    it("ignore une ligne qui concerne une parcelle non demandée", async () => {
      httpGet.mockReturnValue(of({ data: groupes([500], "49020000ZZ9999") }));

      const result = await surfacesLot([PARCELLE]);

      expect(result.data).toEqual(new Map([[PARCELLE, { surface: 0, groupes: [] }]]));
    });

    it("refuse un identifiant qui contiendrait de la syntaxe de filtre", async () => {
      const result = await surfacesLot(["49020000AK0118)&select=*"]);

      expect(result.success).toBe(false);
      expect(httpGet).not.toHaveBeenCalled();
    });

    it("ne fait aucun appel pour une liste vide", async () => {
      const result = await surfacesLot([]);

      expect(result).toMatchObject({ success: true, data: new Map() });
      expect(httpGet).not.toHaveBeenCalled();
    });
  });
});
