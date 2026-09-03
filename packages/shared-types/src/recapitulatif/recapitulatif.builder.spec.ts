import { describe, expect, it } from "vitest";
import { EnrichissementOutputDto } from "../enrichissement";
import { DonneesComplementairesInputDto } from "../evaluation";
import { EtatBatiInfrastructure, PresencePollution, TypeProprietaire } from "../evaluation/enums";
import {
  IlotChaleurUrbain,
  RisqueRetraitGonflementArgile,
  ZonageReglementaire,
} from "../enrichissement";
import { CRITERES_METADATA_LIST } from "./criteres.metadata";
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

  it("répartit les 28 critères sur les sections", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const criteres = sections.flatMap((s) => s.criteres).filter((c) => !c.informatif);
    expect(criteres).toHaveLength(28);
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
    expect(criteres).toHaveLength(29);
    expect(criteres.every((c) => c.valeurAffichee === "Non disponible")).toBe(true);
  });

  it("ajoute l'îlot de chaleur urbain comme donnée informative de la section site et bâti", () => {
    const sections = buildRecapitulatifSite(
      { ...enrichissement, ilotChaleurUrbain: IlotChaleurUrbain.OUI },
      complementaires,
    );
    const siteBati = sections.find((s) => s.id === "site-bati");
    const icu = siteBati?.criteres[siteBati.criteres.length - 1];

    expect(icu?.key).toBe("ilotChaleurUrbain");
    expect(icu?.label).toBe("Site concerné par un îlot de chaleur");
    expect(icu?.valeurAffichee).toBe("Oui (+ de 5,5 °C)");
    expect(icu?.informatif).toBe(true);
    expect(icu?.sourceLabel).toBe("ICU (CSTB)");
  });

  it("distingue un site sous le seuil d'un site hors périmètre d'étude", () => {
    const sousSeuil = buildRecapitulatifSite(
      { ...enrichissement, ilotChaleurUrbain: IlotChaleurUrbain.NON },
      complementaires,
    );
    const horsPerimetre = buildRecapitulatifSite(
      { ...enrichissement, ilotChaleurUrbain: IlotChaleurUrbain.NON_COUVERT },
      complementaires,
    );
    const valeur = (sections: ReturnType<typeof buildRecapitulatifSite>) =>
      sections.flatMap((s) => s.criteres).find((c) => c.key === "ilotChaleurUrbain")
        ?.valeurAffichee;

    expect(valeur(sousSeuil)).toBe("Non (- de 5,5 °C)");
    expect(valeur(horsPerimetre)).toBe("Non couvert par la cartographie");
  });

  it("n'ajoute aucune donnée informative aux critères de l'algorithme", () => {
    const sections = buildRecapitulatifSite(enrichissement, complementaires);
    const informatifs = sections.flatMap((s) => s.criteres).filter((c) => c.informatif);

    expect(informatifs.map((c) => c.key)).toEqual(["ilotChaleurUrbain"]);
    expect(CRITERES_METADATA_LIST.map((c) => c.key)).not.toContain("ilotChaleurUrbain");
  });
});
