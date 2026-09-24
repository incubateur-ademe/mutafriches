import { describe, expect, it } from "vitest";
import {
  comparerStatuts,
  compterParStatut,
  convertirCapca,
  MIN_ZONES_ATTENDUES,
  validerCollection,
} from "./zones-contrainte-enr.format";

const carre = [
  [
    [2.123456789, 47.123456789],
    [2.2, 47.1],
    [2.2, 47.2],
    [2.123456789, 47.123456789],
  ],
];

// Fichier capca.json minimal au format Enedis, avec assez de zones pour passer le plancher
function capca(statuts: Record<string, string> = {}, total = MIN_ZONES_ATTENDUES) {
  const zones: Record<string, unknown> = {};
  for (let i = 0; i < total; i++) {
    const id = String(70000 + i);
    zones[id] = {
      id,
      status: statuts[id] ?? "TRES_FAVORABLE",
      geometry: { type: "Polygon", coordinates: carre },
    };
  }
  return { data: { zones_data: { total }, geo_status_data: zones } };
}

describe("convertirCapca", () => {
  it("ne garde que l'identifiant et le statut, coordonnées arrondies à 5 décimales", () => {
    const zone = convertirCapca(capca({ "70000": "SATUREE" })).features[0];

    expect(zone.properties).toEqual({ id: "70000", statut: "SATUREE" });
    expect((zone.geometry.coordinates as number[][][])[0][0]).toEqual([2.12346, 47.12346]);
  });

  it("trie les zones par identifiant pour une sortie stable", () => {
    const fichier = capca();
    const zones = fichier.data.geo_status_data;
    const inverse = Object.fromEntries(Object.entries(zones).reverse());

    const ids = convertirCapca({ data: { geo_status_data: inverse } }).features.map(
      (f) => f.properties.id,
    );

    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
  });

  it("refuse un statut inconnu", () => {
    expect(() => convertirCapca(capca({ "70001": "BLOQUEE" }))).toThrow(/statut inconnu/);
  });

  it("refuse un fichier tronqué", () => {
    expect(() => convertirCapca(capca({}, 100))).toThrow(/Fichier suspect/);
  });

  it("refuse un format sans geo_status_data", () => {
    expect(() => convertirCapca({ data: {} })).toThrow(/geo_status_data/);
  });
});

describe("validerCollection", () => {
  it("relit sans perte le GeoJSON produit par convertirCapca", () => {
    const collection = convertirCapca(capca({ "70000": "SATUREE" }));

    expect(validerCollection(JSON.parse(JSON.stringify(collection)))).toEqual(collection);
  });
});

describe("comparerStatuts", () => {
  it("liste les changements de statut, les apparitions et les disparitions", () => {
    const avant = convertirCapca(capca({ "70000": "EN_TENSION" }));
    const apres = convertirCapca(capca({ "70000": "SATUREE" }));
    apres.features.pop();
    apres.features.push({ ...apres.features[0], properties: { id: "99999", statut: "FAVORABLE" } });

    expect(comparerStatuts(avant, apres)).toEqual([
      { id: "70000", avant: "EN_TENSION", apres: "SATUREE" },
      { id: String(70000 + MIN_ZONES_ATTENDUES - 1), avant: "TRES_FAVORABLE", apres: null },
      { id: "99999", avant: null, apres: "FAVORABLE" },
    ]);
  });

  it("ne signale rien entre deux versions identiques", () => {
    const collection = convertirCapca(capca({ "70000": "SATUREE" }));

    expect(comparerStatuts(collection, collection)).toEqual([]);
  });
});

describe("compterParStatut", () => {
  it("compte les zones de chaque statut", () => {
    const compte = compterParStatut(convertirCapca(capca({ "70000": "SATUREE", "70001": "ELD" })));

    expect(compte.SATUREE).toBe(1);
    expect(compte.ELD).toBe(1);
    expect(compte.TRES_FAVORABLE).toBe(MIN_ZONES_ATTENDUES - 2);
  });
});
