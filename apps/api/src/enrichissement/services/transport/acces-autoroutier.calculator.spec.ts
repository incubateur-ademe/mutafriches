import { describe, it, expect } from "vitest";
import { IgnWfsTronconRoute } from "../../adapters/ign-wfs/ign-wfs.types";
import { AccesAutoroutierCalculator } from "./acces-autoroutier.calculator";

const troncon = (
  nature: string,
  coordinates: number[][],
  sens = "Sens direct",
): IgnWfsTronconRoute => ({
  type: "Feature",
  id: `${nature}-${coordinates.map((c) => c.join(":")).join("|")}`,
  geometry: { type: "LineString", coordinates },
  properties: { nature, sens_de_circulation: sens },
});

// Chaussée autoroutière nord-sud à la longitude 6.0, parcourue de A vers C
const A = [6.0, 48.0];
const B = [6.0, 48.01];
const C = [6.0, 48.02];
const site = { latitude: 48.01, longitude: 6.02 };

const chausseeMontante = [
  troncon("Type autoroutier", [[6.0, 47.9], A]),
  troncon("Type autoroutier", [A, B]),
  troncon("Type autoroutier", [B, C]),
  troncon("Type autoroutier", [C, [6.0, 48.1]]),
];

describe("AccesAutoroutierCalculator.extraireEntrees", () => {
  it("retient la tête d'une bretelle d'insertion, pas son point de raccordement", () => {
    const entree = [6.01, 48.005];
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [...chausseeMontante, troncon("Bretelle", [entree, B])],
      site,
      5000,
    );

    expect(entrees).toHaveLength(1);
    expect([entrees[0].longitude, entrees[0].latitude]).toEqual(entree);
  });

  it("ignore les bretelles de sortie", () => {
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [...chausseeMontante, troncon("Bretelle", [B, [6.01, 48.012]])],
      site,
      5000,
    );

    expect(entrees).toEqual([]);
  });

  it("tient compte d'une bretelle numérisée à contresens", () => {
    const entree = [6.01, 48.005];
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [...chausseeMontante, troncon("Bretelle", [B, entree], "Sens inverse")],
      site,
      5000,
    );

    expect([entrees[0].longitude, entrees[0].latitude]).toEqual(entree);
  });

  it("remonte une chaîne de bretelles jusqu'au réseau local", () => {
    const tete = [6.02, 48.0];
    const milieu = [6.01, 48.005];
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [...chausseeMontante, troncon("Bretelle", [tete, milieu]), troncon("Bretelle", [milieu, B])],
      site,
      5000,
    );

    expect(entrees).toHaveLength(1);
    expect([entrees[0].longitude, entrees[0].latitude]).toEqual(tete);
  });

  it("s'arrête au nœud où plusieurs bretelles convergent", () => {
    const convergence = [6.01, 48.005];
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [
        ...chausseeMontante,
        troncon("Bretelle", [[6.02, 48.0], convergence]),
        troncon("Bretelle", [[6.02, 48.01], convergence]),
        troncon("Bretelle", [convergence, B]),
      ],
      site,
      5000,
    );

    expect(entrees.map((e) => [e.longitude, e.latitude])).toEqual([convergence]);
  });

  it("retient le début d'une chaussée qui ne prolonge aucun tronçon", () => {
    const debut = [6.0, 48.005];
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [troncon("Type autoroutier", [debut, [6.0, 48.03]])],
      site,
      5000,
    );

    expect(entrees.map((e) => [e.longitude, e.latitude])).toEqual([debut]);
  });

  it("n'invente aucune entrée sur une chaussée à double sens continue", () => {
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [
        troncon("Type autoroutier", [A, B], "Double sens"),
        troncon("Type autoroutier", [B, C], "Double sens"),
      ],
      site,
      5000,
    );

    expect(entrees).toEqual([]);
  });

  it("écarte les entrées hors du rayon et trie par distance à vol d'oiseau", () => {
    const proche = [6.01, 48.01];
    const loin = [6.01, 48.019];
    const horsRayon = [6.2, 48.01];
    const entrees = AccesAutoroutierCalculator.extraireEntrees(
      [
        ...chausseeMontante,
        troncon("Bretelle", [loin, C]),
        troncon("Bretelle", [proche, B]),
        troncon("Bretelle", [horsRayon, A]),
      ],
      site,
      5000,
    );

    expect(entrees.map((e) => [e.longitude, e.latitude])).toEqual([proche, loin]);
    expect(entrees[0].distanceVolOiseauMetres).toBeLessThan(entrees[1].distanceVolOiseauMetres);
  });
});
