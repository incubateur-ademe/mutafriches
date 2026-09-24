import { describe, expect, it } from "vitest";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { contexteCalcul, ecartCalcul, recalculConseille } from "./calcul-obsolete";

function enrichissement(surcharge: Partial<EnrichissementOutputDto> = {}): EnrichissementOutputDto {
  return {
    identifiantParcelle: "92036000L0162",
    codeInsee: "92036",
    commune: "Gennevilliers",
    surfaceSite: 4306,
    surfaceBati: 1200,
    siteEnCentreVille: false,
    distanceAutoroute: 800,
    distanceTransportCommun: 220,
    proximiteCommercesServices: true,
    distanceRaccordementElectrique: null,
    tauxLogementsVacants: 7.1,
    presenceRisquesTechnologiques: false,
    siteReferencePollue: false,
    sourcesUtilisees: [],
    champsManquants: [],
    sourcesEchouees: [],
    ...surcharge,
  } as EnrichissementOutputDto;
}

// Aller-retour JSON : c'est ainsi que le contexte revient du localStorage.
const stocke = (e: EnrichissementOutputDto, version = "v1.14") =>
  JSON.parse(JSON.stringify(contexteCalcul(e, version))) as ReturnType<typeof contexteCalcul>;

describe("ecartCalcul", () => {
  it("considère le calcul à jour si rien n'a changé", () => {
    expect(ecartCalcul(stocke(enrichissement()), enrichissement(), "v1.14")).toBeNull();
  });

  it("liste les critères dont la valeur a changé", () => {
    const ecart = ecartCalcul(
      stocke(enrichissement()),
      enrichissement({ surfaceSite: 20000, distanceAutoroute: 1500 }),
      "v1.14",
    );

    expect(ecart?.criteresModifies).toEqual([
      "Surface du site",
      "Distance par la route à un accès autoroutier",
    ]);
    expect(recalculConseille(ecart!)).toBe(true);
  });

  it("distingue null (recherche sans résultat) d'une donnée indisponible", () => {
    const ecart = ecartCalcul(
      stocke(enrichissement()),
      enrichissement({ distanceRaccordementElectrique: undefined }),
      "v1.14",
    );

    expect(ecart?.criteresIndisponibles).toEqual(["Distance au raccordement électrique"]);
  });

  it("ne conseille pas de recalculer sur une simple panne de source", () => {
    const ecart = ecartCalcul(
      stocke(enrichissement()),
      enrichissement({ surfaceBati: undefined }),
      "v1.14",
    );

    expect(ecart?.criteresModifies).toEqual([]);
    expect(recalculConseille(ecart!)).toBe(false);
  });

  it("signale une donnée redevenue disponible comme une modification", () => {
    const ecart = ecartCalcul(
      stocke(enrichissement({ surfaceBati: undefined })),
      enrichissement(),
      "v1.14",
    );

    expect(ecart?.criteresModifies).toEqual(["Surface bâtie"]);
  });

  it("signale un changement de version d'algorithme", () => {
    const ecart = ecartCalcul(stocke(enrichissement(), "v1.13"), enrichissement(), "v1.14");

    expect(ecart?.versionChangee).toBe(true);
  });

  it("ignore la version tant que la version courante n'est pas chargée", () => {
    expect(ecartCalcul(stocke(enrichissement(), "v1.13"), enrichissement(), "")).toBeNull();
  });

  it("marque comme inconnu un calcul antérieur au suivi", () => {
    const ecart = ecartCalcul(undefined, enrichissement(), "v1.14");

    expect(ecart?.contexteInconnu).toBe(true);
    expect(recalculConseille(ecart!)).toBe(true);
  });
});
