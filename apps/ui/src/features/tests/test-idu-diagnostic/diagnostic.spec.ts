import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseIdu, diagnostiquerIdu } from "./diagnostic";
import {
  fetchParcelByRef,
  fetchSectionParcels,
} from "@shared/services/cadastre/api.cadastre.service";

vi.mock("@shared/services/cadastre/api.cadastre.service", () => ({
  fetchParcelByRef: vi.fn(),
  fetchSectionParcels: vi.fn(),
}));

const mockedByRef = vi.mocked(fetchParcelByRef);
const mockedSection = vi.mocked(fetchSectionParcels);

// geo.api.gouv.fr : commune toujours résolue dans les tests
function stubGeoApi(nom: string | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: nom !== null,
      json: async () => (nom ? { nom } : {}),
    }),
  );
}

function fc(numeros: string[], contenance?: number) {
  return {
    type: "FeatureCollection" as const,
    features: numeros.map((numero) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [0, 0] },
      properties: { numero, contenance },
    })),
  };
}

describe("parseIdu", () => {
  it("découpe un IDU métropole", () => {
    expect(parseIdu("920360000L0266")).toEqual({
      departement: "92",
      codeInsee: "92036",
      prefixe: "000",
      section: "0L",
      numero: "0266",
    });
  });

  it("gère un préfixe de commune absorbée", () => {
    expect(parseIdu("49345133AB0171")).toEqual({
      departement: "49",
      codeInsee: "49345",
      prefixe: "133",
      section: "AB",
      numero: "0171",
    });
  });

  it("gère la Corse (2A/2B) et les DOM (97x)", () => {
    expect(parseIdu("2A004000AB0001").codeInsee).toBe("2A004");
    expect(parseIdu("971200000C0500").codeInsee).toBe("971200");
  });
});

describe("diagnostiquerIdu", () => {
  beforeEach(() => {
    mockedByRef.mockReset();
    mockedSection.mockReset();
    stubGeoApi("Gennevilliers");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejette un format invalide sans appeler le cadastre", async () => {
    const r = await diagnostiquerIdu("PAS-UN-IDU");
    expect(r.statut).toBe("format-invalide");
    expect(mockedByRef).not.toHaveBeenCalled();
  });

  it("retourne 'trouvee' quand la parcelle existe", async () => {
    mockedByRef.mockResolvedValue(fc(["0266"], 1234));
    const r = await diagnostiquerIdu("920360000L0265");
    expect(r.statut).toBe("trouvee");
    expect(r.contenance).toBe(1234);
  });

  it("détecte un numéro périmé et liste les voisins", async () => {
    mockedByRef.mockResolvedValue(fc([])); // exact introuvable
    mockedSection.mockResolvedValue(fc(["0263", "0264", "0265", "0267", "0268"]));
    const r = await diagnostiquerIdu("920360000L0266");
    expect(r.statut).toBe("numero-introuvable");
    expect(r.voisins).toContain("0265");
    expect(r.voisins).toContain("0267");
  });

  it("détecte une section absente", async () => {
    mockedByRef.mockResolvedValue(fc([]));
    mockedSection.mockResolvedValue(fc([]));
    const r = await diagnostiquerIdu("920360000L0266");
    expect(r.statut).toBe("section-absente");
  });

  it("signale une erreur API", async () => {
    mockedByRef.mockResolvedValue(null);
    const r = await diagnostiquerIdu("920360000L0266");
    expect(r.statut).toBe("erreur");
  });
});
