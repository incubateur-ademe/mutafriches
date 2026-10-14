import { describe, expect, it } from "vitest";
import { hotesIntegrateursIframe, INTEGRATEURS_IFRAME } from "./integrateurs-iframe";

describe("INTEGRATEURS_IFRAME", () => {
  it("ne déclare que des hôtes nus (ni schéma, ni chemin, ni port)", () => {
    for (const config of Object.values(INTEGRATEURS_IFRAME)) {
      for (const hote of config.allowedDomains) {
        expect(hote).toMatch(/^[a-z0-9.-]+$/);
      }
    }
  });

  it("hotesIntegrateursIframe agrège sans doublon", () => {
    const hotes = hotesIntegrateursIframe();
    expect(new Set(hotes).size).toBe(hotes.length);
    expect(hotes).toContain("benefriches.ademe.fr");
    expect(hotes).toContain("localhost");
  });
});
