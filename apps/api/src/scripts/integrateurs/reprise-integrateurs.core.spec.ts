import { describe, expect, it } from "vitest";
import { INTEGRATEURS_IFRAME } from "@mutafriches/shared-types";
import { construireLignesReprise, ORIGINE_QGIS_PARTAGEE } from "./reprise-integrateurs.core";

const SOURCES_VIDES = { integrateursIframe: {}, partenaires: [] };

describe("construireLignesReprise", () => {
  it("reprend les origines de la variable en intégrateurs API actifs", () => {
    const lignes = construireLignesReprise({
      ...SOURCES_VIDES,
      originesVariable: "https://benefriches.ademe.fr, https://vmap.exemple.fr/ ",
    });

    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toMatchObject({
      canal: "api",
      structure: "benefriches.ademe.fr",
      origine: "https://benefriches.ademe.fr",
      cleStats: "benefriches.ademe.fr",
      statut: "actif",
      typeStructure: "autre",
    });
    // Slash final normalisé comme le faisait le guard (ADR-0043)
    expect(lignes[1].origine).toBe("https://vmap.exemple.fr");
    expect(lignes.every((ligne) => ligne.activeLe instanceof Date)).toBe(true);
  });

  it("classe l'origine partagée de l'extension en canal QGIS, avec l'hôte pour clé", () => {
    const [ligne] = construireLignesReprise({
      ...SOURCES_VIDES,
      originesVariable: ORIGINE_QGIS_PARTAGEE,
    });

    expect(ligne).toMatchObject({
      canal: "qgis",
      structure: "QGIS non déclaré",
      cleStats: "qgis.mutafriches.beta.gouv.fr",
    });
  });

  it("écarte les doublons, les entrées vides, nos origines et les valeurs illisibles", () => {
    const lignes = construireLignesReprise({
      ...SOURCES_VIDES,
      originesVariable: "https://a.fr,https://a.fr/, ,https://mutafriches.beta.gouv.fr,pas-une-url",
    });

    expect(lignes.map((ligne) => ligne.origine)).toEqual(["https://a.fr"]);
  });

  it("garde toutes les origines d'un même hôte, une seule portant la clé de statistiques", () => {
    const lignes = construireLignesReprise({
      ...SOURCES_VIDES,
      originesVariable:
        "https://outil.exemple.fr,https://outil.exemple.fr:8443,http://outil.exemple.fr",
    });

    expect(lignes.map((ligne) => ligne.origine)).toEqual([
      "https://outil.exemple.fr",
      "https://outil.exemple.fr:8443",
      "http://outil.exemple.fr",
    ]);
    expect(lignes.map((ligne) => ligne.cleStats)).toEqual(["outil.exemple.fr", null, null]);
  });

  it("ne crée rien sans variable", () => {
    expect(construireLignesReprise(SOURCES_VIDES)).toEqual([]);
  });

  it("reprend le registre iframe, sans nos propres entrées", () => {
    const lignes = construireLignesReprise({
      integrateursIframe: INTEGRATEURS_IFRAME,
      partenaires: [],
    });

    expect(lignes.map((ligne) => ligne.cleStats).sort()).toEqual([
      "benefriches",
      "mon_espace_collectivite",
    ]);
    expect(lignes.find((ligne) => ligne.cleStats === "benefriches")).toMatchObject({
      canal: "iframe",
      structure: "Bénéfriches",
      origine: "https://benefriches.incubateur.ademe.dev",
      statut: "actif",
    });
  });

  it("reprend les pages partenaires avec la clé écrite par le tracking", () => {
    const [ligne] = construireLignesReprise({
      integrateursIframe: {},
      partenaires: [{ slug: "ddt-88", nom: "DDT des Vosges", departement: "88" }],
    });

    expect(ligne).toMatchObject({
      canal: "page",
      structure: "DDT des Vosges",
      origine: null,
      cleStats: "partenaire:ddt-88",
      departement: "88",
      statut: "actif",
    });
  });

  it("ne produit jamais deux fois la même clé de statistiques (contrainte d'unicité)", () => {
    const lignes = construireLignesReprise({
      originesVariable: `https://benefriches.ademe.fr,http://benefriches.ademe.fr,${ORIGINE_QGIS_PARTAGEE}`,
      integrateursIframe: INTEGRATEURS_IFRAME,
      partenaires: [{ slug: "aura", nom: "AURA", departement: "69" }],
    });

    const cles = lignes.map((ligne) => ligne.cleStats).filter(Boolean);
    expect(new Set(cles).size).toBe(cles.length);
    // Sans clé, l'unicité (canal, origine) garantit l'idempotence : l'origine est obligatoire.
    expect(lignes.filter((ligne) => !ligne.cleStats).every((ligne) => ligne.origine)).toBe(true);
  });
});
