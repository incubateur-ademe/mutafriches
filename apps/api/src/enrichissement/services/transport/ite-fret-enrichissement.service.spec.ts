import { describe, it, expect, beforeEach, vi } from "vitest";
import { DistanceIte, SourceEnrichissement } from "@mutafriches/shared-types";
import { IteFretEnrichissementService } from "./ite-fret-enrichissement.service";
import { IteFretRepository } from "../../repositories/ite-fret.repository";
import { Site } from "../../../evaluation/entities/site.entity";

describe("IteFretEnrichissementService", () => {
  let service: IteFretEnrichissementService;
  let iteFretRepository: IteFretRepository;

  beforeEach(() => {
    iteFretRepository = {
      findIteProche: vi.fn(),
    } as unknown as IteFretRepository;

    service = new IteFretEnrichissementService(iteFretRepository);
  });

  function createSite(): Site {
    const site = new Site();
    site.identifiantParcelle = "29232000AB0123";
    site.codeInsee = "29232";
    site.commune = "Test Commune";
    site.coordonnees = { latitude: 48.0, longitude: -4.0 };
    return site;
  }

  it("devrait catégoriser MOINS_1KM_BON_ETAT pour une ITE proche en bon état", async () => {
    const site = createSite();

    vi.mocked(iteFretRepository.findIteProche).mockResolvedValue({
      nom: "ITE Test",
      distance: 450,
      etat: "bon",
    });

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBe(DistanceIte.MOINS_1KM_BON_ETAT);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ITE_FRET);
    expect(result.champsManquants).toHaveLength(0);
  });

  it("devrait catégoriser MOINS_1KM_MAUVAIS_ETAT pour une ITE proche en mauvais état", async () => {
    const site = createSite();

    vi.mocked(iteFretRepository.findIteProche).mockResolvedValue({
      nom: "ITE Test",
      distance: 800,
      etat: "mauvais",
    });

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBe(DistanceIte.MOINS_1KM_MAUVAIS_ETAT);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ITE_FRET);
  });

  it("devrait catégoriser MOINS_1KM_MAUVAIS_ETAT par sécurité quand l'état est inconnu mais < 1km", async () => {
    const site = createSite();

    vi.mocked(iteFretRepository.findIteProche).mockResolvedValue({
      nom: "ITE Test",
      distance: 500,
      etat: null,
    });

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBe(DistanceIte.MOINS_1KM_MAUVAIS_ETAT);
    expect(result.success).toBe(true);
  });

  it("devrait catégoriser PLUS_1KM si l'ITE la plus proche est >= 1000m", async () => {
    const site = createSite();

    vi.mocked(iteFretRepository.findIteProche).mockResolvedValue({
      nom: "ITE Test",
      distance: 1500,
      etat: "bon",
    });

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBe(DistanceIte.PLUS_1KM);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ITE_FRET);
  });

  it("devrait catégoriser PLUS_1KM si aucune ITE n'est trouvée dans le rayon", async () => {
    const site = createSite();

    vi.mocked(iteFretRepository.findIteProche).mockResolvedValue(null);

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBe(DistanceIte.PLUS_1KM);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ITE_FRET);
  });

  it("devrait échouer proprement si les coordonnées manquent", async () => {
    const site = new Site();
    site.identifiantParcelle = "29232000AB0123";

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ITE_FRET);
    expect(result.champsManquants).toContain("distanceIte");
    expect(iteFretRepository.findIteProche).not.toHaveBeenCalled();
  });

  it("devrait gérer une erreur DB en marquant la source échouée", async () => {
    const site = createSite();

    vi.mocked(iteFretRepository.findIteProche).mockRejectedValue(new Error("DB connection lost"));

    const result = await service.enrichir(site);

    expect(site.distanceIte).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ITE_FRET);
    expect(result.champsManquants).toContain("distanceIte");
  });
});
