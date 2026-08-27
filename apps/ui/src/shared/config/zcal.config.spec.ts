import { describe, expect, it } from "vitest";
import { construireUrlIframeZcal } from "./zcal.config";

describe("construireUrlIframeZcal", () => {
  it("ajoute les paramètres d'embed et le domaine hôte", () => {
    const url = new URL(construireUrlIframeZcal("mutafriches.beta.gouv.fr"));

    expect(url.searchParams.get("embed")).toBe("1");
    expect(url.searchParams.get("embedType")).toBe("inline");
    expect(url.searchParams.get("embedDomain")).toBe("mutafriches.beta.gouv.fr");
  });

  it("conserve un chemin à deux segments", () => {
    const url = new URL(construireUrlIframeZcal("localhost", "https://zcal.co/i/ABC123"));

    expect(url.pathname).toBe("/i/ABC123");
  });

  it("préfixe /emb un chemin à un seul segment, comme le script d'embed", () => {
    const url = new URL(construireUrlIframeZcal("localhost", "https://zcal.co/equipe-mutafriches"));

    expect(url.pathname).toBe("/emb/equipe-mutafriches");
  });
});
