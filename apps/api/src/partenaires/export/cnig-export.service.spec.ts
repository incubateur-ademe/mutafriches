import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import {
  EtatBatiInfrastructure,
  SourceUtilisation,
  UsageType,
  type EnrichissementOutputDto,
} from "@mutafriches/shared-types";
import { CnigExportService } from "./cnig-export.service";
import type { AppConfig } from "../../config";
import type { EnrichissementService } from "../../enrichissement/services/enrichissement.service";
import type { PartenaireRepository } from "../repositories/partenaire.repository";
import type { PartenaireSite } from "../../shared/database/schemas/partenaire-sites.schema";

function site(surcharge: Partial<PartenaireSite> = {}): PartenaireSite {
  return {
    id: "uuid-1",
    partenaireSlug: "cci-92",
    idtup: "92025000BY0265",
    parcelles: ["92025000BY0265"],
    commune: "COLOMBES",
    codeInsee: "92025",
    nom: null,
    nomDefaut: "Rue des Vallées",
    origine: "seed",
    createdAt: new Date("2026-03-04T10:00:00Z"),
    updatedAt: new Date("2026-03-04T10:00:00Z"),
    updatedBy: null,
    ...surcharge,
  } as PartenaireSite;
}

function enrichissement(surcharge: Partial<EnrichissementOutputDto> = {}): EnrichissementOutputDto {
  return {
    identifiantParcelle: "92025000BY0265",
    codeInsee: "92025",
    commune: "Colombes",
    coordonnees: { latitude: 48.9226, longitude: 2.2537 },
    surfaceSite: 4200,
    siteEnCentreVille: true,
    distanceAutoroute: 800,
    distanceTransportCommun: 220,
    proximiteCommercesServices: true,
    distanceRaccordementElectrique: 150,
    tauxLogementsVacants: 7.1,
    presenceRisquesTechnologiques: false,
    siteReferencePollue: false,
    sourcesUtilisees: [],
    champsManquants: [],
    sourcesEchouees: [],
    ...surcharge,
  };
}

describe("CnigExportService", () => {
  let repository: { findBySlug: ReturnType<typeof vi.fn>; findSites: ReturnType<typeof vi.fn> };
  let enrichissementService: {
    lireCacheSite: ReturnType<typeof vi.fn>;
    enrichirSite: ReturnType<typeof vi.fn>;
  };
  let service: CnigExportService;

  beforeEach(() => {
    repository = {
      findBySlug: vi.fn().mockResolvedValue({ slug: "cci-92", nom: "CCI 92" }),
      findSites: vi.fn().mockResolvedValue([site()]),
    };
    enrichissementService = {
      lireCacheSite: vi.fn().mockResolvedValue(enrichissement()),
      enrichirSite: vi.fn(),
    };

    service = new CnigExportService(
      repository as unknown as PartenaireRepository,
      enrichissementService as unknown as EnrichissementService,
      { publicUrl: "https://mutafriches.beta.gouv.fr" } as AppConfig,
    );
  });

  it("refuse un partenaire inconnu", async () => {
    repository.findBySlug.mockResolvedValue(null);

    await expect(service.exporter("inconnu", { format: "csv" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("sert l'export depuis le cache sans relancer d'enrichissement", async () => {
    const fichier = await service.exporter("cci-92", { format: "csv" });

    expect(enrichissementService.enrichirSite).not.toHaveBeenCalled();
    expect(fichier.rapport).toEqual({ sitesTotal: 1, sitesExportes: 1, sitesEcartes: [] });
    expect(fichier.typeMime).toContain("text/csv");
    expect(fichier.nomFichier).toMatch(/^friches-cnig-cci-92-\d{8}\.csv$/);
    expect(fichier.contenu).toContain("92025_92025000BY0265");
  });

  it("ne compose la réponse qu'avec le slug lu en base, jamais celui reçu en paramètre", async () => {
    repository.findBySlug.mockResolvedValue({ slug: "cci-92", nom: "CCI 92" });

    const fichier = await service.exporter("cci-92-alias", { format: "csv" });

    expect(fichier.nomFichier).toContain("friches-cnig-cci-92-");
    expect(fichier.nomFichier).not.toContain("alias");
    expect(fichier.contenu).toContain("/partenaires/cci-92,");
    expect(fichier.contenu).not.toContain("alias");
  });

  it("renseigne la source avec le partenaire et l'URL de sa page", async () => {
    const fichier = await service.exporter("cci-92", { format: "csv" });

    expect(fichier.contenu).toContain("CCI 92");
    expect(fichier.contenu).toContain("https://mutafriches.beta.gouv.fr/partenaires/cci-92");
  });

  it("enrichit à la volée un site absent du cache, marqué comme pré-chauffe", async () => {
    enrichissementService.lireCacheSite.mockResolvedValue(null);
    enrichissementService.enrichirSite.mockResolvedValue(enrichissement());

    const fichier = await service.exporter("cci-92", { format: "csv" });

    expect(enrichissementService.enrichirSite).toHaveBeenCalledWith(
      ["92025000BY0265"],
      SourceUtilisation.PREFETCH,
      "partenaire:cci-92",
      true,
    );
    expect(fichier.rapport.sitesExportes).toBe(1);
  });

  it("écarte un site non enrichissable en expliquant pourquoi", async () => {
    enrichissementService.lireCacheSite.mockResolvedValue(null);
    enrichissementService.enrichirSite.mockRejectedValue(new Error("cadastre introuvable"));

    const fichier = await service.exporter("cci-92", { format: "csv" });

    expect(fichier.rapport).toEqual({
      sitesTotal: 1,
      sitesExportes: 0,
      sitesEcartes: [
        {
          idtup: "92025000BY0265",
          commune: "COLOMBES",
          motif: "Site non enrichi : données indisponibles au moment de l'export",
        },
      ],
    });
  });

  it("n'attend pas un enrichissement plus long que le budget de la requête", async () => {
    vi.useFakeTimers();
    enrichissementService.lireCacheSite.mockResolvedValue(null);
    enrichissementService.enrichirSite.mockReturnValue(new Promise(() => {}));

    const promesse = service.exporter("cci-92", { format: "csv" });
    await vi.advanceTimersByTimeAsync(25_000);
    const fichier = await promesse;

    expect(fichier.rapport.sitesExportes).toBe(0);
    expect(fichier.rapport.sitesEcartes[0].motif).toContain("Site non enrichi");
    vi.useRealTimers();
  });

  it("écarte un site enrichi sans centroïde : geompoint est obligatoire", async () => {
    const sansCentroide = enrichissement();
    delete sansCentroide.coordonnees;
    enrichissementService.lireCacheSite.mockResolvedValue(sansCentroide);

    const fichier = await service.exporter("cci-92", { format: "csv" });

    expect(fichier.rapport.sitesExportes).toBe(0);
    expect(fichier.rapport.sitesEcartes[0].motif).toContain("Enrichissement incomplet");
  });

  it("applique la connaissance terrain transmise au site correspondant", async () => {
    const fichier = await service.exporter("cci-92", {
      format: "csv",
      connaissanceTerrain: {
        "92025000BY0265": {
          etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
        } as never,
      },
    });

    expect(fichier.contenu).toContain("dégradation très importante");
  });

  it("ignore les indices de mutabilité tant qu'ils ne sont pas demandés", async () => {
    const fichier = await service.exporter("cci-92", {
      format: "csv",
      mutabilite: { "92025000BY0265": { indices: { [UsageType.RENATURATION]: 72.4 } } },
    });

    expect(fichier.contenu).not.toContain("mf_indice_renaturation");
  });

  it("ajoute les colonnes Mutafriches et renomme le fichier quand elles sont demandées", async () => {
    const fichier = await service.exporter("cci-92", {
      format: "csv",
      inclureMutabilite: true,
      versionAlgorithme: "1.13",
      mutabilite: {
        "92025000BY0265": {
          indices: { [UsageType.RENATURATION]: 72.4 },
          usagePrioritaire: UsageType.RENATURATION,
          fiabilite: 8.5,
        },
      },
    });

    expect(fichier.nomFichier).toContain("-etendu.csv");
    expect(fichier.contenu).toContain("mf_indice_renaturation");
    expect(fichier.contenu).toContain("72.4");
    expect(fichier.contenu).toContain("1.13");
  });

  it("produit un GeoJSON quand ce format est demandé", async () => {
    const fichier = await service.exporter("cci-92", { format: "geojson" });

    expect(fichier.typeMime).toContain("application/geo+json");
    expect(JSON.parse(fichier.contenu)).toMatchObject({ type: "FeatureCollection" });
  });

  it("ordonne les sites par commune puis identifiant malgré la concurrence", async () => {
    repository.findSites.mockResolvedValue([
      site({ idtup: "B", commune: "NANTERRE" }),
      site({ idtup: "A", commune: "COLOMBES" }),
    ]);
    enrichissementService.lireCacheSite.mockImplementation(async (parcelles: string[]) => {
      if (parcelles[0] === "92025000BY0265") return enrichissement();
      return enrichissement();
    });

    const fichier = await service.exporter("cci-92", { format: "geojson" });
    const features = (
      JSON.parse(fichier.contenu) as { features: { properties: { site_id: string } }[] }
    ).features;

    expect(features.map((f) => f.properties.site_id)).toEqual(["92025_A", "92025_B"]);
  });
});
