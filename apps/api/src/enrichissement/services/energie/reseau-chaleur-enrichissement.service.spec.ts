import { Test, TestingModule } from "@nestjs/testing";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Site } from "../../../evaluation/entities/site.entity";
import { ReseauxChaleurRepository } from "../../repositories/reseaux-chaleur.repository";
import { ReseauChaleurEnrichissementService } from "./reseau-chaleur-enrichissement.service";

const reseau = (distance: number, overrides: Record<string, unknown> = {}) => ({
  distance,
  nom: "Réseau de Belle Beille",
  gestionnaire: "ALTER SERVICES",
  identifiantReseau: "4911C",
  traceComplet: true,
  ...overrides,
});

describe("ReseauChaleurEnrichissementService", () => {
  let service: ReseauChaleurEnrichissementService;
  let repository: { findReseauProche: ReturnType<typeof vi.fn> };
  let site: Site;

  beforeEach(async () => {
    repository = { findReseauProche: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReseauChaleurEnrichissementService,
        { provide: ReseauxChaleurRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<ReseauChaleurEnrichissementService>(ReseauChaleurEnrichissementService);

    site = new Site();
    site.identifiantParcelle = "49020000AK0118";
    site.coordonnees = { latitude: 47.474038, longitude: -0.606407 };
  });

  it("enrichit la distance au réseau le plus proche", async () => {
    repository.findReseauProche.mockResolvedValue(reseau(59));

    const resultat = await service.enrichir(site);

    expect(repository.findReseauProche).toHaveBeenCalledWith(47.474038, -0.606407);
    expect(site.distanceReseauChaleur).toBe(59);
    expect(resultat.success).toBe(true);
    expect(resultat.sourcesUtilisees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.champsManquants).toHaveLength(0);
  });

  it("arrondit la distance au mètre", async () => {
    repository.findReseauProche.mockResolvedValue(reseau(486.72));

    await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBe(487);
  });

  // Une absence de réseau est un résultat de recherche : la compter en source échouée
  // invaliderait le cache strict de tous les sites hors réseau de chaleur.
  it("traite l'absence de réseau comme un succès, pas comme une source échouée", async () => {
    repository.findReseauProche.mockResolvedValue(null);

    const resultat = await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBeNull();
    expect(resultat.success).toBe(true);
    expect(resultat.sourcesUtilisees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.sourcesEchouees).toHaveLength(0);
    expect(resultat.champsManquants).toHaveLength(0);
  });

  it("exploite un réseau dont seul le point est publié", async () => {
    repository.findReseauProche.mockResolvedValue(reseau(312, { traceComplet: false }));

    const resultat = await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBe(312);
    expect(resultat.success).toBe(true);
  });

  it("gère l'absence de coordonnées sans interroger le référentiel", async () => {
    site.coordonnees = undefined;

    const resultat = await service.enrichir(site);

    expect(repository.findReseauProche).not.toHaveBeenCalled();
    expect(site.distanceReseauChaleur).toBeUndefined();
    expect(resultat.success).toBe(false);
    expect(resultat.sourcesEchouees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.champsManquants).toContain("distanceReseauChaleur");
  });

  it("gère l'échec de la requête en laissant le champ indisponible", async () => {
    repository.findReseauProche.mockRejectedValue(new Error("relation inexistante"));

    const resultat = await service.enrichir(site);

    expect(site.distanceReseauChaleur).toBeUndefined();
    expect(resultat.success).toBe(false);
    expect(resultat.sourcesEchouees).toContain(SourceEnrichissement.FRANCE_CHALEUR_URBAINE);
    expect(resultat.champsManquants).toContain("distanceReseauChaleur");
  });
});
