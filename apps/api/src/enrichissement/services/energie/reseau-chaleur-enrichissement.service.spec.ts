import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Site } from "../../../evaluation/entities/site.entity";
import { FranceChaleurUrbaineService } from "../../adapters/france-chaleur-urbaine/france-chaleur-urbaine.service";
import { ReseauChaleurEnrichissementService } from "./reseau-chaleur-enrichissement.service";

const reponse = (data: Record<string, unknown>) => ({
  success: true,
  data,
  source: SourceEnrichissement.FRANCE_CHALEUR_URBAINE,
});

describe("ReseauChaleurEnrichissementService", () => {
  let service: ReseauChaleurEnrichissementService;
  let adapter: { getEligibilite: ReturnType<typeof vi.fn> };
  let site: Site;

  beforeEach(async () => {
    adapter = { getEligibilite: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReseauChaleurEnrichissementService,
        { provide: FranceChaleurUrbaineService, useValue: adapter },
      ],
    }).compile();

    service = module.get<ReseauChaleurEnrichissementService>(ReseauChaleurEnrichissementService);

    site = new Site();
    site.identifiantParcelle = "49353000AV1652";
    site.coordonnees = { latitude: 47.4457, longitude: -0.4667 };
  });

  it("enrichit la distance au réseau de chaleur", async () => {
    adapter.getEligibilite.mockResolvedValue(reponse({ distance: 444, futurNetwork: false }));

    const resultat = await service.enrichir(site);

    expect(adapter.getEligibilite).toHaveBeenCalledWith(47.4457, -0.4667);
    expect(site.distanceReseauChaleur).toBe(444);
    expect(resultat.success).toBe(true);
    expect(resultat.sourcesUtilisees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.champsManquants).toHaveLength(0);
  });

  it("arrondit la distance au mètre", async () => {
    adapter.getEligibilite.mockResolvedValue(reponse({ distance: 486.72, futurNetwork: true }));

    await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBe(487);
  });

  // Une absence de distance est un résultat de recherche : la compter en source échouée
  // invaliderait le cache strict de tous les sites hors réseau de chaleur.
  it("traite une distance nulle comme un succès, pas comme une source échouée", async () => {
    adapter.getEligibilite.mockResolvedValue(reponse({ distance: null, futurNetwork: false }));

    const resultat = await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBeNull();
    expect(resultat.success).toBe(true);
    expect(resultat.sourcesUtilisees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.sourcesEchouees).toHaveLength(0);
    expect(resultat.champsManquants).toHaveLength(0);
  });

  it("traite de la même façon un réseau connu dont le tracé est indisponible", async () => {
    adapter.getEligibilite.mockResolvedValue(
      reponse({ distance: null, futurNetwork: false, id: "4916C", name: "LES PLAINES - TRELAZE" }),
    );

    const resultat = await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBeNull();
    expect(resultat.sourcesEchouees).toHaveLength(0);
  });

  it("gère l'absence de coordonnées sans appeler l'API", async () => {
    site.coordonnees = undefined;

    const resultat = await service.enrichir(site);

    expect(adapter.getEligibilite).not.toHaveBeenCalled();
    expect(site.distanceReseauChaleur).toBeUndefined();
    expect(resultat.success).toBe(false);
    expect(resultat.sourcesEchouees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.champsManquants).toContain("distanceReseauChaleur");
  });

  it("gère l'échec de l'API en laissant le champ indisponible", async () => {
    adapter.getEligibilite.mockResolvedValue({
      success: false,
      error: "timeout of 3000ms exceeded",
      source: SourceEnrichissement.FRANCE_CHALEUR_URBAINE,
    });

    const resultat = await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBeUndefined();
    expect(resultat.success).toBe(false);
    expect(resultat.sourcesEchouees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.champsManquants).toContain("distanceReseauChaleur");
  });
});
