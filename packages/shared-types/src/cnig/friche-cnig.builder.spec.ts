import { describe, expect, it } from "vitest";
import type { EnrichissementOutputDto } from "../enrichissement/dto/enrichissement-output.dto";
import { DistanceIte } from "../enrichissement/enums/distance-ite.enum";
import { ZonageReglementaire } from "../enrichissement/enums/zonage-reglementaire.enum";
import { ZoneAccelerationEnr } from "../enrichissement/enums/zone-acceleration-enr.enum";
import { EtatBatiInfrastructure } from "../evaluation/enums/etat-bati.enum";
import { PresencePollution } from "../evaluation/enums/presence-pollution.enum";
import { UsageType } from "../evaluation/enums/usage.enum";
import type { MutabiliteOutputDto } from "../evaluation/dto/mutabilite-output.dto";
import {
  commentaireDesserte,
  construireExtensionMutafriches,
  construireFricheCnig,
  resumerMutabilite,
} from "./friche-cnig.builder";
import { COLONNES_FRICHE_CNIG } from "./friche-cnig.types";

const SOURCE = { nom: "Mutafriches", producteur: "DDT des Vosges", url: "https://exemple.fr" };

function enrichissement(surcharge: Partial<EnrichissementOutputDto> = {}): EnrichissementOutputDto {
  return {
    identifiantParcelle: "49020000AK0118",
    codeInsee: "49020",
    commune: "Beaucouzé",
    coordonnees: { latitude: 47.4721, longitude: -0.6339 },
    surfaceSite: 7193,
    siteEnCentreVille: false,
    distanceAutoroute: 1200,
    distanceTransportCommun: 350,
    proximiteCommercesServices: true,
    distanceRaccordementElectrique: 420,
    tauxLogementsVacants: 6.2,
    presenceRisquesTechnologiques: false,
    siteReferencePollue: false,
    sourcesUtilisees: [],
    champsManquants: [],
    sourcesEchouees: [],
    ...surcharge,
  };
}

describe("construireFricheCnig", () => {
  const site = {
    idtup: "49020000AK0118",
    parcelles: ["49020000AK0118"],
    nom: "Rue Georges Morel",
    dateIdentification: new Date("2026-03-04T10:00:00Z"),
  };

  it("produit exactement les 51 colonnes du standard", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement(),
      source: SOURCE,
    });

    expect(friche).not.toBeNull();
    expect(Object.keys(friche!).sort()).toEqual([...COLONNES_FRICHE_CNIG].sort());
    expect(COLONNES_FRICHE_CNIG).toHaveLength(51);
  });

  it("sert les attributs obligatoires du standard", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement({ zoneAccelerationEnr: ZoneAccelerationEnr.NON }),
      source: SOURCE,
      dateActualisation: new Date("2026-09-17T08:00:00Z"),
    })!;

    expect(friche.site_id).toBe("49020_49020000AK0118");
    expect(friche.site_nom).toBe("Rue Georges Morel");
    expect(friche.site_type).toBe("inconnu");
    expect(friche.site_identif_date).toBe("2026-03-04");
    expect(friche.site_actu_date).toBe("2026-09-17");
    expect(friche.comm_nom).toBe("Beaucouzé");
    expect(friche.comm_insee).toBe("49020");
    expect(friche.urba_zaer).toBe("non");
    expect(friche.source_nom).toBe("Mutafriches");
    expect(friche.geompoint).toBe("POINT(47.4721 -0.6339)");
  });

  it("écarte un site sans centroïde : geompoint est obligatoire", () => {
    const sansCoordonnees = enrichissement();
    delete sansCoordonnees.coordonnees;

    expect(
      construireFricheCnig({ site, enrichissement: sansCoordonnees, source: SOURCE }),
    ).toBeNull();
  });

  it("écarte un site jamais enrichi et sans commune connue", () => {
    expect(construireFricheCnig({ site, source: SOURCE })).toBeNull();
  });

  it("se rabat sur la commune et le code INSEE stockés en base", () => {
    const friche = construireFricheCnig({
      site: { ...site, commune: "COLOMBES", codeInsee: "92025" },
      enrichissement: enrichissement({ codeInsee: "92025", commune: "Colombes" }),
      source: SOURCE,
    })!;

    expect(friche.comm_insee).toBe("92025");
  });

  it("préfère la commune prédominante en multi-parcelle", () => {
    const friche = construireFricheCnig({
      site: { ...site, parcelles: ["49020000AK0118", "49020000AK0119"] },
      enrichissement: enrichissement({ communePredominante: "Beaucouzé Sud" }),
      source: SOURCE,
    })!;

    expect(friche.comm_nom).toBe("Beaucouzé Sud");
    expect(friche.unite_fonciere_refcad).toBe("49020000AK0118|49020000AK0119");
  });

  it("reprend l'identifiant technique comme nom à défaut de libellé", () => {
    const friche = construireFricheCnig({
      site: { idtup: "c-a1b2c3", parcelles: ["49020000AK0118"] },
      enrichissement: enrichissement(),
      source: SOURCE,
    })!;

    expect(friche.site_nom).toBe("c-a1b2c3");
  });

  it("n'expose jamais de nom de propriétaire ni d'adresse devinée", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement(),
      source: SOURCE,
    })!;

    expect(friche.proprio_nom).toBeNull();
    expect(friche.site_adresse).toBeNull();
  });

  it("reporte les surfaces en entiers", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement({ surfaceSite: 7193.4, surfaceBati: 1250.6 }),
      source: SOURCE,
    })!;

    expect(friche.unite_fonciere_surface).toBe(7193);
    expect(friche.bati_surface).toBe(1251);
  });

  it("intègre la connaissance terrain quand elle est fournie", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement(),
      complementaires: {
        etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
        presencePollution: PresencePollution.OUI_AMIANTE,
      },
      source: SOURCE,
    })!;

    expect(friche.bati_etat).toBe("dégradation moyenne");
    expect(friche.bati_pollution).toBe("amiante");
    expect(friche.sol_pollution_existe).toBe("pollution avérée");
  });

  it("signale un site référencé ADEME faute de saisie", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement({ siteReferencePollue: true }),
      source: SOURCE,
    })!;

    expect(friche.sol_pollution_existe).toBe("pollution supposée");
    expect(friche.sol_pollution_commentaire).toContain("ADEME");
  });

  it("laisse desserte_distance vide, faute de distance au réseau fluvial", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement(),
      source: SOURCE,
    })!;

    expect(friche.desserte_distance).toBeNull();
    expect(friche.desserte_commentaire).toContain("voie de grande circulation");
  });

  it("réserve la place du préfixe de neutralisation dans la longueur du standard", () => {
    const nomFormule = construireFricheCnig({
      site: { ...site, nom: `=${"a".repeat(300)}` },
      enrichissement: enrichissement(),
      source: SOURCE,
    })!;
    const nomOrdinaire = construireFricheCnig({
      site: { ...site, nom: "a".repeat(300) },
      enrichissement: enrichissement(),
      source: SOURCE,
    })!;

    // 254 + l'apostrophe ajoutée à l'écriture CSV = 255, la longueur du standard.
    expect(nomFormule.site_nom).toHaveLength(254);
    expect(nomOrdinaire.site_nom).toHaveLength(255);
  });

  it("tronque le nom de source à la longueur du standard", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement(),
      source: { nom: "Mutafriches — plateforme nationale des friches" },
    })!;

    expect(friche.source_nom).toHaveLength(20);
  });

  it("reprend le zonage réglementaire et le document d'urbanisme", () => {
    const friche = construireFricheCnig({
      site,
      enrichissement: enrichissement({
        zonageReglementaire: ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION,
      }),
      source: SOURCE,
    })!;

    expect(friche.urba_zone_type).toBe("Zc");
    expect(friche.urba_doc_type).toBe("CC");
  });
});

describe("commentaireDesserte", () => {
  it("énumère les distances disponibles", () => {
    const commentaire = commentaireDesserte(
      enrichissement({
        distanceAutoroute: 1200,
        distanceTransportCommun: 350,
        distanceIte: DistanceIte.MOINS_1KM_BON_ETAT,
        distanceRaccordementElectrique: 420,
        distanceReseauChaleur: 57,
      }),
    );

    expect(commentaire).toContain("voie de grande circulation à 1,2 km");
    expect(commentaire).toContain("transport en commun à 350 m");
    expect(commentaire).toContain("embranchement ferroviaire fret à moins d'1 km, en bon état");
    expect(commentaire).toContain("réseau de chaleur à 57 m");
  });

  it("ignore les distances non recherchées", () => {
    const commentaire = commentaireDesserte(
      enrichissement({
        distanceTransportCommun: null,
        distanceRaccordementElectrique: null,
        distanceReseauChaleur: null,
      }),
    );

    expect(commentaire).not.toContain("transport en commun");
    expect(commentaire).not.toContain("raccordement électrique");
  });

  it("retourne null sans enrichissement", () => {
    expect(commentaireDesserte()).toBeNull();
  });
});

describe("extension Mutafriches", () => {
  const mutabilite: MutabiliteOutputDto = {
    fiabilite: {
      note: 8.5,
      text: "Fiable",
      description: "",
      criteresRenseignes: 28,
      criteresTotal: 30,
      poidsRenseignes: 29,
      poidsTotal: 32,
    },
    resultats: [
      { rang: 1, usage: UsageType.RENATURATION, indiceMutabilite: 72.4 },
      { rang: 2, usage: UsageType.RESIDENTIEL, indiceMutabilite: 61.2 },
    ],
  };

  it("résume un calcul complet", () => {
    expect(resumerMutabilite(mutabilite)).toEqual({
      indices: { renaturation: 72.4, residentiel: 61.2 },
      usagePrioritaire: UsageType.RENATURATION,
      fiabilite: 8.5,
    });
  });

  it("remplit les colonnes hors standard", () => {
    const extension = construireExtensionMutafriches(resumerMutabilite(mutabilite), "1.13");

    expect(extension.mf_indice_renaturation).toBe(72.4);
    expect(extension.mf_indice_residentiel).toBe(61.2);
    expect(extension.mf_usage_prioritaire).toBe("renaturation");
    expect(extension.mf_fiabilite).toBe(8.5);
    expect(extension.mf_version_algorithme).toBe("1.13");
  });

  it("ignore un usage prioritaire ou un indice non reconnus", () => {
    const extension = construireExtensionMutafriches(
      {
        indices: { [UsageType.RENATURATION]: "72,4" as never, [UsageType.CULTURE]: 55 },
        usagePrioritaire: "<script>" as never,
        fiabilite: "8.5" as never,
      },
      "1.13",
    );

    expect(extension.mf_indice_renaturation).toBeNull();
    expect(extension.mf_indice_culture).toBe(55);
    expect(extension.mf_usage_prioritaire).toBeNull();
    expect(extension.mf_fiabilite).toBeNull();
  });

  it("laisse tout vide pour un site non évalué, version d'algorithme comprise", () => {
    const extension = construireExtensionMutafriches(undefined, "1.13");

    expect(extension.mf_indice_renaturation).toBeNull();
    expect(extension.mf_version_algorithme).toBeNull();
  });
});
