import { describe, it, expect } from "vitest";
import { safeError } from "./safe-error";

describe("safeError", () => {
  it("résume une erreur Axios sans dérouler l'objet (message + statut + url)", () => {
    const axiosErreur = {
      isAxiosError: true,
      message: "Request failed with status code 400",
      code: "ERR_BAD_REQUEST",
      response: { status: 400, request: { socket: {} } }, // socket = objet circulaire à ne pas dérouler
      config: { url: "https://tabular-api.data.gouv.fr/x" },
    };

    const resultat = safeError(axiosErreur);

    expect(resultat).toContain("status code 400");
    expect(resultat).toContain("status=400");
    expect(resultat).toContain("url=https://tabular-api.data.gouv.fr/x");
    // Reste sur une seule ligne (pas d'inspection profonde)
    expect(resultat).not.toContain("\n");
  });

  it("formate une Error standard", () => {
    expect(safeError(new TypeError("boom"))).toBe("TypeError: boom");
  });

  it("gère les valeurs non-objet", () => {
    expect(safeError("texte")).toBe("texte");
    expect(safeError(42)).toBe("42");
  });
});
