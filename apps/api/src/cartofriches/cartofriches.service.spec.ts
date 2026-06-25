import { describe, it, expect, beforeEach, vi } from "vitest";
import { FrichesCerema } from "@mutafriches/shared-types";
import { CartofrichesService } from "./cartofriches.service";
import { CartofrichesAdapter } from "./cartofriches.adapter";
import { CARTOFRICHES_SOURCE } from "./cartofriches.constants";

function createFriche(overrides: Partial<FrichesCerema> = {}): FrichesCerema {
  return {
    site_id: "49353_13291",
    site_nom: "Site test",
    site_type: null,
    site_statut: null,
    site_adresse: null,
    comm_nom: "TRELAZE",
    comm_insee: "49353",
    dep: "49",
    unite_fonciere_surface: 4091,
    unite_fonciere_refcad: "['49353000AC0628']",
    site_surface: 4091,
    bati_surface: null,
    emprise_sol_bati: "0",
    bati_etat: null,
    bati_pollution: null,
    bati_patrimoine: null,
    site_numero_basol: null,
    site_numero_basias: null,
    sol_pollution_existe: null,
    urba_zone_type: "U",
    urba_zone_lib: null,
    zonage_enviro: null,
    monuhisto: null,
    monuhisto500: null,
    proprio_type: null,
    proprio_personne: null,
    site_zaer: null,
    distance_ite_bon: null,
    distance_ite_mauvais: null,
    desserte_distance_ferroviaire: null,
    site_vocadomi: null,
    zone_activites: null,
    p_residentiel: null,
    p_equipement: null,
    p_culturel: null,
    p_tertiaire: null,
    p_industriel: null,
    p_renaturation: null,
    p_pv: null,
    ...overrides,
  };
}

describe("CartofrichesService", () => {
  let service: CartofrichesService;
  let adapter: CartofrichesAdapter;

  beforeEach(() => {
    adapter = { getFrichesParCommune: vi.fn() } as unknown as CartofrichesAdapter;
    service = new CartofrichesService(adapter);
  });

  it("trouve une friche mono-parcelle par référence cadastrale", async () => {
    vi.mocked(adapter.getFrichesParCommune).mockResolvedValue({
      success: true,
      data: [createFriche()],
      source: CARTOFRICHES_SOURCE,
    });

    const result = await service.rechercher("49353000AC0628", "49353");

    expect(result.trouve).toBe(true);
    expect(result.friche?.site_id).toBe("49353_13291");
    expect(result.refcadParsees).toContain("49353000AC0628");
    expect(result.ficheUrl).toContain("49353_13291");
  });

  it("trouve une friche quand l'identifiant multi-parcelle recoupe la référence", async () => {
    vi.mocked(adapter.getFrichesParCommune).mockResolvedValue({
      success: true,
      data: [createFriche({ unite_fonciere_refcad: "['49353000AC0629']" })],
      source: CARTOFRICHES_SOURCE,
    });

    const result = await service.rechercher("49353000AC0628,49353000AC0629", "49353");

    expect(result.trouve).toBe(true);
  });

  it("retourne trouve=false avec le nombre de candidats si aucune correspondance", async () => {
    vi.mocked(adapter.getFrichesParCommune).mockResolvedValue({
      success: true,
      data: [createFriche({ unite_fonciere_refcad: "['49353000ZZ9999']" })],
      source: CARTOFRICHES_SOURCE,
    });

    const result = await service.rechercher("49353000AC0628", "49353");

    expect(result.trouve).toBe(false);
    expect(result.friche).toBeNull();
    expect(result.nbCandidats).toBe(1);
  });

  it("remonte l'erreur quand l'API Cartofriches échoue", async () => {
    vi.mocked(adapter.getFrichesParCommune).mockResolvedValue({
      success: false,
      error: "timeout",
      source: CARTOFRICHES_SOURCE,
    });

    const result = await service.rechercher("49353000AC0628", "49353");

    expect(result.trouve).toBe(false);
    expect(result.erreur).toBe("timeout");
  });

  it("reconstitue le champ proprio_type éclaté caractère par caractère", async () => {
    vi.mocked(adapter.getFrichesParCommune).mockResolvedValue({
      success: true,
      data: [createFriche({ proprio_type: ["{", "F", "6", "c", "}"] })],
      source: CARTOFRICHES_SOURCE,
    });

    const result = await service.rechercher("49353000AC0628", "49353");

    expect(result.friche?.proprio_type).toBe("F6c");
  });

  it("met en cache les friches d'une commune (un seul appel adapter pour deux recherches)", async () => {
    vi.mocked(adapter.getFrichesParCommune).mockResolvedValue({
      success: true,
      data: [createFriche()],
      source: CARTOFRICHES_SOURCE,
    });

    await service.rechercher("49353000AC0628", "49353");
    await service.rechercher("49353000AC0628", "49353");

    expect(adapter.getFrichesParCommune).toHaveBeenCalledTimes(1);
  });
});
