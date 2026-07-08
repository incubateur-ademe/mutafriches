import { describe, expect, it } from "vitest";
import { EnrichissementOutputDto } from "../enrichissement";
import { DonneesComplementairesInputDto } from "../evaluation";
import { EtatBatiInfrastructure, PresencePollution, TypeProprietaire } from "../evaluation/enums";
import { RisqueRetraitGonflementArgile, ZonageReglementaire } from "../enrichissement";
import { buildRecapitulatifSite } from "./recapitulatif.builder";

const enrichissement = {
  surfaceSite: 11338,
  surfaceBati: 300,
  distanceRaccordementElectrique: 355,
  siteEnCentreVille: false,
  proximiteCommercesServices: false,
  tauxLogementsVacants: 7.2,
  distanceTransportCommun: 355,
  distanceAutoroute: 355,
  presenceRisquesTechnologiques: true,
  risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
  zonageReglementaire: ZonageReglementaire.ZONE_NATURELLE_N,
} as EnrichissementOutputDto;

const complementaires: Partial<DonneesComplementairesInputDto> = {
  typeProprietaire: TypeProprietaire.MIXTE,
  etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
  presencePollution: PresencePollution.OUI_AUTRES_COMPOSES,
};

describe("buildRecapitulatifSite", () => {
  it("retourne les trois sections dans l'ordre", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    expect(sections.map((s) => s.id)).toEqual(["site-bati", "environnement", "risques-zonages"]);
  });

  it("répartit les 27 critères sur les sections", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const total = sections.reduce((n, s) => n + s.criteres.length, 0);
    expect(total).toBe(27);
  });

  it("formate les valeurs enrichies (surface en m², distance, %)", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const criteres = sections.flatMap((s) => s.criteres);
    expect(criteres.find((c) => c.key === "surfaceSite")?.valeurAffichee).toBe(
      `${(11338).toLocaleString("fr-FR")} m²`,
    );
    expect(criteres.find((c) => c.key === "surfaceBati")?.valeurAffichee).toBe("300 m²");
    expect(criteres.find((c) => c.key === "distanceTransportCommun")?.valeurAffichee).toBe("355 m");
    expect(criteres.find((c) => c.key === "tauxLogementsVacants")?.valeurAffichee).toBe("7,2 %");
  });

  it("résout les libellés des valeurs enum (auto et manuel)", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const criteres = sections.flatMap((s) => s.criteres);
    expect(criteres.find((c) => c.key === "typeProprietaire")?.valeurAffichee).toBe(
      "Mixte public et privé",
    );
    expect(criteres.find((c) => c.key === "etatBatiInfrastructure")?.valeurAffichee).toBe(
      "Bâti moyennement dégradé",
    );
    expect(criteres.find((c) => c.key === "zonageReglementaire")?.valeurAffichee).toBe(
      "Zone naturelle (N)",
    );
  });

  it("marque la saisie et la source des critères", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const criteres = sections.flatMap((s) => s.criteres);

    const surface = criteres.find((c) => c.key === "surfaceSite");
    expect(surface?.saisie).toBe("AUTOMATIQUE");
    expect(surface?.sourceLabel).toBe("Cadastre");

    const proprietaire = criteres.find((c) => c.key === "typeProprietaire");
    expect(proprietaire?.saisie).toBe("MANUELLE");
    expect(proprietaire?.source).toBeUndefined();
    expect(proprietaire?.sourceLabel).toBeUndefined();
  });

  it("expose les trois risques naturels comme lignes distinctes", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const risques = sections.find((s) => s.id === "risques-zonages");
    const keys = risques?.criteres.map((c) => c.key) ?? [];
    expect(keys).toContain("risqueRetraitGonflementArgile");
    expect(keys).toContain("risqueCavitesSouterraines");
    expect(keys).toContain("risqueInondation");
  });

  it("affiche 'Non disponible' pour les valeurs manquantes", () => {
    const sections = buildRecapitulatifSite(undefined, undefined);
    const criteres = sections.flatMap((s) => s.criteres);
    expect(criteres).toHaveLength(27);
    expect(criteres.every((c) => c.valeurAffichee === "Non disponible")).toBe(true);
  });
});
