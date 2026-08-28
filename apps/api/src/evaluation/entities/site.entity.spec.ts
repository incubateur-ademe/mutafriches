import { describe, expect, it } from "vitest";
import { Site } from "./site.entity";
import { RaccordementEau } from "@mutafriches/shared-types";
import {
  DONNEES_COMPLEMENTAIRES_COMPLETES,
  DONNEES_ENRICHIES_PARTENAIRE,
} from "../__test-helpers__/calculer-mutabilite.fixtures";

describe("Site", () => {
  describe("copie des données enrichies", () => {
    it("conserve codeInsee en mode sansEnrichissement", () => {
      const site = Site.fromInput({
        donneesEnrichies: DONNEES_ENRICHIES_PARTENAIRE,
        donneesComplementaires: DONNEES_COMPLEMENTAIRES_COMPLETES,
      });

      // codeInsee est NOT NULL en base : son absence faisait échouer la persistance en 500
      expect(site.codeInsee).toBe("49353");
      expect(site.champsEssentielsManquants()).toEqual([]);
    });

    it("produit le même site depuis fromInput et fromEnrichissement", () => {
      const depuisInput = Site.fromInput({
        donneesEnrichies: DONNEES_ENRICHIES_PARTENAIRE,
        donneesComplementaires: DONNEES_COMPLEMENTAIRES_COMPLETES,
      });
      const depuisEnrichissement = Site.fromEnrichissement(
        DONNEES_ENRICHIES_PARTENAIRE,
        DONNEES_COMPLEMENTAIRES_COMPLETES,
      );

      expect({ ...depuisInput }).toEqual({ ...depuisEnrichissement });
    });

    it("ignore les propriétés inattendues du JSON entrant", () => {
      const donneesPolluees = {
        ...DONNEES_ENRICHIES_PARTENAIRE,
        estComplete: 1,
        proprieteInconnue: "valeur",
      } as never;

      const site = Site.fromEnrichissement(donneesPolluees, DONNEES_COMPLEMENTAIRES_COMPLETES);

      expect(typeof site.estComplete).toBe("function");
      expect(site).not.toHaveProperty("proprieteInconnue");
      expect(site.estComplete()).toBe(true);
    });

    it("dérive raccordementEau de la surface bâtie, sans tenir compte de la saisie", () => {
      const site = Site.fromEnrichissement(DONNEES_ENRICHIES_PARTENAIRE, {
        ...DONNEES_COMPLEMENTAIRES_COMPLETES,
        raccordementEau: RaccordementEau.NON,
      });

      expect(site.raccordementEau).toBe(RaccordementEau.OUI);
    });
  });

  describe("champsEssentielsManquants", () => {
    it("ne considère pas une surface de 0 comme absente", () => {
      const site = Site.fromEnrichissement(
        { ...DONNEES_ENRICHIES_PARTENAIRE, surfaceSite: 0 },
        DONNEES_COMPLEMENTAIRES_COMPLETES,
      );

      expect(site.champsEssentielsManquants()).toEqual([]);
    });

    it("liste les champs d'identification absents", () => {
      const site = Site.fromEnrichissement(
        {
          ...DONNEES_ENRICHIES_PARTENAIRE,
          codeInsee: undefined as unknown as string,
          commune: "",
        },
        DONNEES_COMPLEMENTAIRES_COMPLETES,
      );

      expect(site.champsEssentielsManquants()).toEqual(["codeInsee", "commune"]);
    });
  });

  describe("estComplete", () => {
    it("est vrai avec les données d'identification et les 9 champs complémentaires", () => {
      const site = Site.fromEnrichissement(
        DONNEES_ENRICHIES_PARTENAIRE,
        DONNEES_COMPLEMENTAIRES_COMPLETES,
      );

      expect(site.estComplete()).toBe(true);
    });

    it("est faux sans données complémentaires", () => {
      const site = Site.fromEnrichissement(DONNEES_ENRICHIES_PARTENAIRE);

      expect(site.estComplete()).toBe(false);
    });
  });
});
