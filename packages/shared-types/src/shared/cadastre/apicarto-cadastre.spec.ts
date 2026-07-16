import { describe, expect, it } from "vitest";
import {
  apicartoCadastreUrl,
  apicartoParamsParAttributs,
  apicartoParamsParPoint,
  premiereParcelle,
  toParcelleCadastre,
} from "./apicarto-cadastre";

describe("apicartoParamsParAttributs", () => {
  it("pad la section à 2 et le numéro à 4 et fixe source_ign", () => {
    expect(apicartoParamsParAttributs("77305", "A", "13")).toEqual({
      code_insee: "77305",
      section: "0A",
      numero: "0013",
      source_ign: "PCI",
    });
  });

  it("laisse une section à 2 lettres inchangée", () => {
    expect(apicartoParamsParAttributs("77305", "AB", "160").section).toBe("AB");
  });
});

describe("apicartoParamsParPoint", () => {
  it("encode un point WGS84 en geom GeoJSON", () => {
    const params = apicartoParamsParPoint(2.95, 48.386);
    expect(JSON.parse(params.geom)).toEqual({ type: "Point", coordinates: [2.95, 48.386] });
    expect(params.source_ign).toBe("PCI");
  });
});

describe("apicartoCadastreUrl", () => {
  it("construit une URL avec query-string encodée", () => {
    const url = apicartoCadastreUrl({ code_insee: "77305", section: "AB" });
    expect(url).toBe("https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=77305&section=AB");
  });

  it("encode les caractères spéciaux (geom)", () => {
    const url = apicartoCadastreUrl(apicartoParamsParPoint(2.95, 48.386));
    expect(url).toContain("geom=%7B%22type%22%3A%22Point%22");
  });
});

describe("toParcelleCadastre / premiereParcelle", () => {
  const feature = {
    properties: {
      idu: "77305000AB0160",
      code_insee: "77305",
      nom_com: "Montereau-Fault-Yonne",
      section: "AB",
      numero: "0160",
      contenance: 1234,
    },
  };

  it("mappe une feature vers ParcelleCadastre", () => {
    expect(toParcelleCadastre(feature)).toEqual({
      idu: "77305000AB0160",
      codeInsee: "77305",
      commune: "Montereau-Fault-Yonne",
      section: "AB",
      numero: "0160",
      contenance: 1234,
    });
  });

  it("retourne la première parcelle d'une réponse", () => {
    expect(premiereParcelle({ features: [feature] })?.idu).toBe("77305000AB0160");
  });

  it("retourne null si aucune feature", () => {
    expect(premiereParcelle({ features: [] })).toBeNull();
    expect(premiereParcelle({})).toBeNull();
  });
});
