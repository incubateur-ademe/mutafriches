import { describe, expect, it } from "vitest";
import {
  DistanceIte,
  ZoneAccelerationEnr,
  type EnrichissementOutputDto,
  type FrichesCerema,
} from "@mutafriches/shared-types";
import {
  categorieIteDepuisCerema,
  comparerSites,
  compterEcarts,
  scoreCartofriches,
} from "./comparaison";

function enrich(overrides: Partial<EnrichissementOutputDto> = {}): EnrichissementOutputDto {
  return {
    identifiantParcelle: "49353000AC0628",
    codeInsee: "49353",
    commune: "Trélazé",
    surfaceSite: 4091,
    siteEnCentreVille: false,
    distanceAutoroute: 4000,
    distanceTransportCommun: 300,
    proximiteCommercesServices: false,
    distanceRaccordementElectrique: 50,
    tauxLogementsVacants: 5,
    presenceRisquesTechnologiques: false,
    siteReferencePollue: false,
    sourcesUtilisees: [],
    champsManquants: [],
    sourcesEchouees: [],
    ...overrides,
  } as EnrichissementOutputDto;
}

function friche(overrides: Partial<FrichesCerema> = {}): FrichesCerema {
  return {
    site_id: "49353_13291",
    comm_insee: "49353",
    comm_nom: "TRELAZE",
    unite_fonciere_surface: 4091,
    unite_fonciere_refcad: "['49353000AC0628']",
    distance_ite_bon: null,
    distance_ite_mauvais: null,
    site_zaer: null,
    site_numero_basol: null,
    site_numero_basias: null,
    sol_pollution_existe: null,
    bati_surface: null,
    p_residentiel: null,
    p_industriel: null,
    p_pv: null,
    ...overrides,
  } as unknown as FrichesCerema;
}

describe("comparerSites", () => {
  it("retourne une liste vide si la friche est absente", () => {
    expect(comparerSites(enrich(), null)).toEqual([]);
  });

  it("ne signale pas d'écart de surface dans la tolérance de 5%", () => {
    const lignes = comparerSites(
      enrich({ surfaceSite: 4100 }),
      friche({ unite_fonciere_surface: 4091 }),
    );
    const surface = lignes.find((l) => l.cle === "surfaceSite");
    expect(surface?.ecart).toBe(false);
  });

  it("signale un écart de surface au-delà de 5%", () => {
    const lignes = comparerSites(
      enrich({ surfaceSite: 5000 }),
      friche({ unite_fonciere_surface: 4091 }),
    );
    const surface = lignes.find((l) => l.cle === "surfaceSite");
    expect(surface?.ecart).toBe(true);
    expect(surface?.magnitude).toMatch(/%$/);
  });

  it("compare la commune en ignorant la casse et les accents", () => {
    const lignes = comparerSites(enrich({ commune: "Trélazé" }), friche({ comm_nom: "TRELAZE" }));
    const commune = lignes.find((l) => l.cle === "commune");
    expect(commune?.ecart).toBe(false);
  });

  it("détecte un écart ITE : Mutafriches < 1km mauvais vs Cerema > 1km", () => {
    // Cas réel observé : modale dit < 1km mais distance_ite_mauvais = 1.22 km
    const lignes = comparerSites(
      enrich({ distanceIte: DistanceIte.MOINS_1KM_MAUVAIS_ETAT, distanceIteMetres: 850 }),
      friche({ distance_ite_bon: 2.63, distance_ite_mauvais: 1.22 }),
    );
    const ite = lignes.find((l) => l.cle === "distanceIte");
    expect(ite?.ecart).toBe(true);
    expect(ite?.cartofriches).toContain("1.22 km");
    // Distances réelles des deux côtés dans la note
    expect(ite?.note).toContain("850 m");
    expect(ite?.note).toContain("1.22 km");
    // 1.22 km est proche du seuil de 1 km → note enrichie
    expect(ite?.note).toContain("proche du seuil");
  });

  it("n'ajoute pas la note 'proche du seuil' pour un écart franc (ITE très éloignée)", () => {
    const lignes = comparerSites(
      enrich({ distanceIte: DistanceIte.MOINS_1KM_MAUVAIS_ETAT }),
      friche({ distance_ite_bon: 5, distance_ite_mauvais: 4 }),
    );
    const ite = lignes.find((l) => l.cle === "distanceIte");
    expect(ite?.ecart).toBe(true);
    expect(ite?.note).not.toContain("proche du seuil");
  });

  it("signale l'anomalie Cartofriches quand la donnée API (1.22 km) arrondit à 1 km", () => {
    const lignes = comparerSites(
      enrich({ distanceIte: DistanceIte.MOINS_1KM_MAUVAIS_ETAT }),
      friche({ distance_ite_bon: 2.63, distance_ite_mauvais: 1.22 }),
    );
    const ite = lignes.find((l) => l.cle === "distanceIte");
    expect(ite?.warning).toContain("se contredit");
  });

  it("ne signale pas d'anomalie quand la distance API est franchement > 1 km", () => {
    const lignes = comparerSites(
      enrich({ distanceIte: DistanceIte.MOINS_1KM_MAUVAIS_ETAT }),
      friche({ distance_ite_bon: 5, distance_ite_mauvais: 4 }),
    );
    const ite = lignes.find((l) => l.cle === "distanceIte");
    expect(ite?.warning).toBeUndefined();
  });

  it("ne signale pas d'écart ITE quand les catégories concordent", () => {
    const lignes = comparerSites(
      enrich({ distanceIte: DistanceIte.MOINS_1KM_BON_ETAT }),
      friche({ distance_ite_bon: 0.4, distance_ite_mauvais: 2 }),
    );
    const ite = lignes.find((l) => l.cle === "distanceIte");
    expect(ite?.ecart).toBe(false);
  });

  it("détecte un écart ZAER (oui vs non)", () => {
    const lignes = comparerSites(
      enrich({ zoneAccelerationEnr: ZoneAccelerationEnr.OUI }),
      friche({ site_zaer: "non" }),
    );
    const zaer = lignes.find((l) => l.cle === "zoneAccelerationEnr");
    expect(zaer?.ecart).toBe(true);
  });

  it("détecte un écart de pollution (Basol côté Cerema, non côté Mutafriches)", () => {
    const lignes = comparerSites(
      enrich({ siteReferencePollue: false }),
      friche({ site_numero_basol: "PAL4902436" }),
    );
    const pollu = lignes.find((l) => l.cle === "siteReferencePollue");
    expect(pollu?.ecart).toBe(true);
    expect(pollu?.cartofriches).toBe("Oui");
  });

  it("ne compare pas la pollution quand elle est non renseignée côté Cartofriches", () => {
    const lignes = comparerSites(
      enrich({ siteReferencePollue: true }),
      friche({
        site_numero_basol: null,
        site_numero_basias: null,
        sol_pollution_existe: "inconnu",
      }),
    );
    const pollu = lignes.find((l) => l.cle === "siteReferencePollue");
    expect(pollu?.comparable).toBe(false);
    expect(pollu?.ecart).toBe(false);
    expect(pollu?.cartofriches).toBe("Non renseigné");
  });

  it("compte uniquement les écarts comparables", () => {
    const lignes = comparerSites(
      enrich({ surfaceSite: 5000, distanceIte: DistanceIte.PLUS_1KM }),
      friche({ unite_fonciere_surface: 4091, distance_ite_bon: 0.4 }),
    );
    expect(compterEcarts(lignes)).toBeGreaterThanOrEqual(2);
  });
});

describe("categorieIteDepuisCerema", () => {
  it("classe bon état si distance_ite_bon < 1 km", () => {
    expect(
      categorieIteDepuisCerema(friche({ distance_ite_bon: 0.5, distance_ite_mauvais: 0.3 })),
    ).toBe(DistanceIte.MOINS_1KM_BON_ETAT);
  });

  it("classe mauvais état si seul distance_ite_mauvais < 1 km", () => {
    expect(
      categorieIteDepuisCerema(friche({ distance_ite_bon: 2.6, distance_ite_mauvais: 0.8 })),
    ).toBe(DistanceIte.MOINS_1KM_MAUVAIS_ETAT);
  });

  it("classe > 1 km si aucune distance sous le seuil", () => {
    expect(
      categorieIteDepuisCerema(friche({ distance_ite_bon: 2.6, distance_ite_mauvais: 1.22 })),
    ).toBe(DistanceIte.PLUS_1KM);
  });
});

describe("scoreCartofriches", () => {
  it("retourne 'non calculé (beta)' quand tous les indices sont null", () => {
    expect(scoreCartofriches(friche())).toBe("non calculé (beta)");
  });

  it("retourne les indices quand au moins un est présent", () => {
    expect(scoreCartofriches(friche({ p_residentiel: 65 }))).toContain("65");
  });
});
