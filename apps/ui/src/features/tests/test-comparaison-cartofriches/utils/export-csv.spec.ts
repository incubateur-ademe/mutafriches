import { describe, expect, it } from "vitest";
import { genererCsvEcarts, type SiteCompare } from "./export-csv";

const siteAvecEcart: SiteCompare = {
  identifiant: "49353000AC0628",
  commune: "Trélazé",
  trouveCartofriches: true,
  ficheUrl: "https://cartofriches.cerema.fr/cartofriches/?site=49353_13291",
  scoreCartofriches: "non calculé (beta)",
  lignes: [
    {
      cle: "surfaceSite",
      label: "Surface du site",
      mutafriches: "5000 m²",
      cartofriches: "4091 m²",
      ecart: true,
      comparable: true,
      magnitude: "+22.2%",
      note: "Écart > tolérance ±5%",
    },
  ],
};

const siteNonTrouve: SiteCompare = {
  identifiant: "12345000AB0001",
  commune: "Inconnue",
  trouveCartofriches: false,
  ficheUrl: null,
  scoreCartofriches: "—",
  lignes: [],
};

describe("genererCsvEcarts", () => {
  it("génère un en-tête et une ligne par champ comparé", () => {
    const csv = genererCsvEcarts([siteAvecEcart]);
    const lignes = csv.split("\n");
    expect(lignes[0]).toContain("identifiant;commune");
    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toContain("Surface du site");
    expect(lignes[1]).toContain("+22.2%");
  });

  it("émet une ligne 'non trouvé' pour un site absent de Cartofriches", () => {
    const csv = genererCsvEcarts([siteNonTrouve]);
    const lignes = csv.split("\n");
    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toContain("non trouvé dans Cartofriches");
  });

  it("échappe les valeurs contenant le séparateur", () => {
    const site: SiteCompare = {
      ...siteAvecEcart,
      lignes: [{ ...siteAvecEcart.lignes[0], note: "valeur; avec point-virgule" }],
    };
    const csv = genererCsvEcarts([site]);
    expect(csv).toContain('"valeur; avec point-virgule"');
  });
});
