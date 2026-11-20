import { describe, expect, it } from "vitest";
import { CanalIntegrateur } from "@mutafriches/shared-types";
import { cleStatsPublication } from "./gestion-integrateurs.core";

const REFERENTIELS = { slugsPartenaires: ["ddt-88"], identifiantsIframe: ["benefriches"] };

describe("cleStatsPublication", () => {
  it("donne partenaire:<slug> à une page dont le partenaire existe", () => {
    expect(cleStatsPublication({ canal: CanalIntegrateur.PAGE }, "ddt-88", REFERENTIELS)).toEqual({
      cleStats: "partenaire:ddt-88",
    });
  });

  it("refuse une page dont le partenaire n'est pas en base", () => {
    expect(
      cleStatsPublication({ canal: CanalIntegrateur.PAGE }, "inconnu", REFERENTIELS),
    ).toHaveProperty("erreur");
  });

  it("donne l'identifiant à une iframe présente dans le registre du code", () => {
    expect(
      cleStatsPublication({ canal: CanalIntegrateur.IFRAME }, "benefriches", REFERENTIELS),
    ).toEqual({ cleStats: "benefriches" });
  });

  it("refuse une iframe absente du registre du code", () => {
    expect(
      cleStatsPublication({ canal: CanalIntegrateur.IFRAME }, "nouveau", REFERENTIELS),
    ).toHaveProperty("erreur");
  });

  it.each([CanalIntegrateur.API, CanalIntegrateur.QGIS])("refuse le canal %s", (canal) => {
    expect(cleStatsPublication({ canal }, "x", REFERENTIELS)).toHaveProperty("erreur");
  });
});
